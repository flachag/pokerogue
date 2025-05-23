import { BattlerIndex } from "#app/battle";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { WeatherType } from "#enums/weather-type";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Weather - Hail", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .weather(WeatherType.HAIL)
      .battleType("single")
      .moveset(Moves.SPLASH)
      .enemyMoveset(Moves.SPLASH)
      .enemySpecies(Species.MAGIKARP);
  });

  it("inflicts damage equal to 1/16 of Pokemon's max HP at turn end", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("TurnEndPhase");

    game.scene.getField(true).forEach(pokemon => {
      expect(pokemon.hp).toBe(pokemon.getMaxHp() - Math.max(Math.floor(pokemon.getMaxHp() / 16), 1));
    });
  });

  it("does not inflict damage to a Pokemon that is underwater (Dive) or underground (Dig)", async () => {
    game.override.moveset([Moves.DIG]);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.DIG);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("TurnEndPhase");

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    expect(playerPokemon.hp).toBe(playerPokemon.getMaxHp());
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp() - Math.max(Math.floor(enemyPokemon.getMaxHp() / 16), 1));
  });

  it("does not inflict damage to Ice type Pokemon", async () => {
    await game.classicMode.startBattle([Species.CLOYSTER]);

    game.move.select(Moves.SPLASH);

    await game.phaseInterceptor.to("TurnEndPhase");

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    expect(playerPokemon.hp).toBe(playerPokemon.getMaxHp());
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp() - Math.max(Math.floor(enemyPokemon.getMaxHp() / 16), 1));
  });
});

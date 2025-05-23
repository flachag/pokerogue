import { allMoves } from "#app/data/moves/move";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { TrainerSlot } from "#enums/trainer-slot";
import { PokemonType } from "#enums/pokemon-type";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import * as Messages from "#app/messages";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

function testMoveEffectiveness(
  game: GameManager,
  move: Moves,
  targetSpecies: Species,
  expected: number,
  targetAbility: Abilities = Abilities.BALL_FETCH,
  teraType?: PokemonType,
): void {
  // Suppress getPokemonNameWithAffix because it calls on a null battle spec
  vi.spyOn(Messages, "getPokemonNameWithAffix").mockReturnValue("");
  game.override.enemyAbility(targetAbility);

  const user = game.scene.addPlayerPokemon(getPokemonSpecies(Species.SNORLAX), 5);
  const target = game.scene.addEnemyPokemon(getPokemonSpecies(targetSpecies), 5, TrainerSlot.NONE);

  if (teraType !== undefined) {
    target.teraType = teraType;
    target.isTerastallized = true;
  }

  expect(target.getMoveEffectiveness(user, allMoves[move])).toBe(expected);
  user.destroy();
  target.destroy();
}

describe("Moves - Type Effectiveness", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    game = new GameManager(phaserGame);

    game.override.ability(Abilities.BALL_FETCH);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("Normal-type attacks are neutrally effective against Normal-type Pokemon", () =>
    testMoveEffectiveness(game, Moves.TACKLE, Species.SNORLAX, 1));

  it("Normal-type attacks are not very effective against Steel-type Pokemon", () =>
    testMoveEffectiveness(game, Moves.TACKLE, Species.REGISTEEL, 0.5));

  it("Normal-type attacks are doubly resisted by Steel/Rock-type Pokemon", () =>
    testMoveEffectiveness(game, Moves.TACKLE, Species.AGGRON, 0.25));

  it("Normal-type attacks have no effect on Ghost-type Pokemon", () =>
    testMoveEffectiveness(game, Moves.TACKLE, Species.DUSCLOPS, 0));

  it("Normal-type status moves are not affected by type matchups", () =>
    testMoveEffectiveness(game, Moves.GROWL, Species.DUSCLOPS, 1));

  it("Electric-type attacks are super-effective against Water-type Pokemon", () =>
    testMoveEffectiveness(game, Moves.THUNDERBOLT, Species.BLASTOISE, 2));

  it("Ghost-type attacks have no effect on Normal-type Pokemon", () =>
    testMoveEffectiveness(game, Moves.SHADOW_BALL, Species.URSALUNA, 0));

  it("Electric-type attacks are doubly super-effective against Water/Flying-type Pokemon", () =>
    testMoveEffectiveness(game, Moves.THUNDERBOLT, Species.GYARADOS, 4));

  it("Electric-type attacks are negated by Volt Absorb", () =>
    testMoveEffectiveness(game, Moves.THUNDERBOLT, Species.GYARADOS, 0, Abilities.VOLT_ABSORB));

  it("Electric-type attacks are super-effective against Tera-Water Pokemon", () =>
    testMoveEffectiveness(game, Moves.THUNDERBOLT, Species.EXCADRILL, 2, Abilities.BALL_FETCH, PokemonType.WATER));

  it("Powder moves have no effect on Grass-type Pokemon", () =>
    testMoveEffectiveness(game, Moves.SLEEP_POWDER, Species.AMOONGUSS, 0));

  it("Powder moves have no effect on Tera-Grass Pokemon", () =>
    testMoveEffectiveness(game, Moves.SLEEP_POWDER, Species.SNORLAX, 0, Abilities.BALL_FETCH, PokemonType.GRASS));

  it("Prankster-boosted status moves have no effect on Dark-type Pokemon", () => {
    game.override.ability(Abilities.PRANKSTER);
    testMoveEffectiveness(game, Moves.BABY_DOLL_EYES, Species.MIGHTYENA, 0);
  });

  it("Prankster-boosted status moves have no effect on Tera-Dark Pokemon", () => {
    game.override.ability(Abilities.PRANKSTER);
    testMoveEffectiveness(game, Moves.BABY_DOLL_EYES, Species.SNORLAX, 0, Abilities.BALL_FETCH, PokemonType.DARK);
  });
});

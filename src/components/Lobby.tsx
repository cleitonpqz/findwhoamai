"use client";

import { createMatch, startMatch } from "@/lib/api";
import { ProfileTypeId } from "@/types/domain";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ALL_PROFILE_TYPES: ProfileTypeId[] = [
  "PERSON",
  "PLACE",
  "THING",
  "ANIMAL",
];

const PROFILE_TYPE_LABEL: Record<ProfileTypeId, string> = {
  PERSON: "Pessoa",
  PLACE: "Lugar",
  THING: "Objeto",
  ANIMAL: "Animal",
};

export default function Lobby() {
  const router = useRouter();
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [draft, setDraft] = useState<string>("");
  const [targetRounds, setTargetRounds] = useState<number>(5);
  const [allowedTypes, setAllowedTypes] =
    useState<ProfileTypeId[]>(ALL_PROFILE_TYPES);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  function addPlayer() {
    const name = draft.trim();
    if (!name) return;
    if (playerNames.includes(name)) {
      setError("A player with that name already exists");
      return;
    }
    setPlayerNames([...playerNames, name]);
    setDraft("");
    setError(null);
  }

  function removePlayer(name: string) {
    setPlayerNames(playerNames.filter((n) => n !== name));
  }

  function toggleProfileType(type: ProfileTypeId) {
    setAllowedTypes((current) =>
      current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type],
    );
  }

  async function handleStart() {
    if (playerNames.length < 2) {
      setError("At least 2 players are required to start the match");
      return;
    }
    if (allowedTypes.length === 0) {
      setError("At least 1 profile type must be selected");
      return;
    }
    setIsStarting(true);
    setError(null);
    try {
      const match = await createMatch({
        players: playerNames.map((name) => ({ name })),
        config: {
          targetRounds,
          allowedProfileTypes: allowedTypes,
          cluesPerCard: 10,
          locale: "pt-BR",
        },
      });
      await startMatch(match.id);
      // We'll wire navigation in the next step
      console.log("Match started:", match.id);
      router.push(`/match/${match.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start the match. Please try again.",
      );
      console.error(err);
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">Perfil Game</h1>

      {/* Players */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Players</h2>

        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPlayer()}
            placeholder="Player name"
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <button
            onClick={addPlayer}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        {playerNames.length > 0 && (
          <ul className="space-y-1">
            {playerNames.map((name) => (
              <li
                key={name}
                className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-md"
              >
                <span>{name}</span>
                <button
                  onClick={() => removePlayer(name)}
                  className="text-red-600 hover:text-red-800"
                  aria-label={`Remove ${name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Profile types */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Profile types</h2>
        <div className="grid grid-cols-2 gap-2">
          {ALL_PROFILE_TYPES.map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md cursor-pointer"
            >
              <input
                type="checkbox"
                checked={allowedTypes.includes(type)}
                onChange={() => toggleProfileType(type)}
              />
              {PROFILE_TYPE_LABEL[type]}
            </label>
          ))}
        </div>
      </section>

      {/* Rounds */}
      <section className="space-y-2">
        <label htmlFor="rounds" className="block text-xl font-semibold">
          Rounds
        </label>
        <input
          id="rounds"
          type="number"
          min={1}
          max={20}
          value={targetRounds}
          onChange={(e) => setTargetRounds(Number(e.target.value))}
          className="w-full px-3 py-2 border rounded-md"
        />
      </section>

      {/* Error */}
      {error && (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={isStarting}
        className="w-full py-3 bg-green-600 text-white text-lg font-semibold rounded-md hover:bg-green-700 disabled:opacity-50"
      >
        {isStarting ? "Starting…" : "Start match"}
      </button>
    </div>
  );
}

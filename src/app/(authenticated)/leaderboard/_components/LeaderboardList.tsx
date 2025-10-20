import React from "react";
import { UserRow } from "./UserRow";

// Mock data for static implementation
const mockUsers = [
  { rank: 1, name: "John Doe", avatar: "john-doe", score: 1000 },
  { rank: 2, name: "Jane Smith", avatar: "jane-smith", score: 950 },
  { rank: 3, name: "Alice Johnson", avatar: "alice-johnson", score: 900 },
  { rank: 4, name: "Bob Brown", avatar: "bob-brown", score: 850 },
  { rank: 5, name: "Charlie Davis", avatar: "charlie-davis", score: 800 },
];

interface LeaderboardListProps {
  scrollRef?: React.RefObject<HTMLUListElement>;
}

export function LeaderboardList({ scrollRef }: LeaderboardListProps) {
  return (
    <ul ref={scrollRef} className="flex-grow overflow-y-auto px-2">
      {mockUsers.map((user) => (
        <UserRow key={user.rank} user={user} />
      ))}
    </ul>
  );
}

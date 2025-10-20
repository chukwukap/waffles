// app/helpers/apiMocks.ts
import { User } from "@/stores/leaderboardStore";
import type { Player, Question, Message } from "../stores/gameStore";

export async function fetchPlayersMock(): Promise<Player[]> {
  // Simulated player list with dummy avatars
  return [
    { id: "p1", name: "Alice", avatar: "https://i.pravatar.cc/80?u=Alice" },
    { id: "p2", name: "Bob", avatar: "https://i.pravatar.cc/80?u=Bob" },
    { id: "p3", name: "Charlie", avatar: "https://i.pravatar.cc/80?u=Charlie" },
    { id: "p4", name: "Dave", avatar: "https://i.pravatar.cc/80?u=Dave" },
    { id: "p5", name: "Eve", avatar: "https://i.pravatar.cc/80?u=Eve" },
    { id: "p6", name: "Mallory", avatar: "https://i.pravatar.cc/80?u=Mallory" },
  ];
}

export async function fetchQuestionsMock(): Promise<Question[]> {
  // Simulated questions for two rounds (3 questions each)
  return [
    {
      id: "q1",
      text: "Which movie is this scene from?",
      image: "https://via.placeholder.com/400x300.png?text=Scene+1",
      options: ["Inception", "Matrix", "Avatar"],
      correctIndex: 0,
    },
    {
      id: "q2",
      text: "Which character is shown here?",
      image: "https://via.placeholder.com/400x300.png?text=Character+1",
      options: ["Harry Potter", "Frodo Baggins", "Luke Skywalker"],
      correctIndex: 2,
    },
    {
      id: "q3",
      text: "Identify the meme template:",
      image: "https://via.placeholder.com/400x300.png?text=Meme+1",
      options: [
        "Distracted Boyfriend",
        "Drake Hotline Bling",
        "Expanding Brain",
      ],
      correctIndex: 1,
    },
    {
      id: "q4",
      text: "Which basketball player is this?",
      image: "https://via.placeholder.com/400x300.png?text=Player+1",
      options: ["LeBron James", "Michael Jordan", "Kobe Bryant"],
      correctIndex: 0,
    },
    {
      id: "q5",
      text: "Which painting style is used here?",
      image: "https://via.placeholder.com/400x300.png?text=Art+1",
      options: ["Cubism", "Surrealism", "Impressionism"],
      correctIndex: 2,
    },
    {
      id: "q6",
      text: "Which city skyline is this?",
      image: "https://via.placeholder.com/400x300.png?text=City+1",
      options: ["New York", "London", "Dubai"],
      correctIndex: 0,
    },
  ];
}

export async function fetchInitialMessagesMock(): Promise<Message[]> {
  // A couple of starter chat messages
  return [
    { id: "m1", user: "Alice", text: "Hi everyone! Ready to win?" },
    { id: "m2", user: "Bob", text: "Good luck all 🎉" },
  ];
}

// Dummy API simulation for lobby flows

export async function validateInviteCode(
  code: string
): Promise<{ valid: boolean; message?: string }> {
  // Simulate network delay
  await new Promise((res) => setTimeout(res, 500));
  const validCodes = ["WAFFLE2025", "INVITE123", "FCASTER"]; // sample valid codes
  const normalized = code.trim().toUpperCase();
  if (validCodes.includes(normalized)) {
    return { valid: true };
  } else {
    return { valid: false, message: "Invite code not found" };
  }
}

export async function purchaseWaffle(
  typeId: string
): Promise<{ ticketId: number; waffleType: string; message: string }> {
  // Simulate network delay
  await new Promise((res) => setTimeout(res, 800));
  // Return a dummy ticket
  return {
    ticketId: Math.floor(Math.random() * 1000000),
    waffleType: typeId,
    message: "Purchase successful",
  };
}

export const currentData: User[] = [
  {
    rank: 1,
    name: "John Doe",
    avatar: "https://i.pravatar.cc/80?u=John Doe",
    score: 1000,
  },
  {
    rank: 2,
    name: "Jane Smith",
    avatar: "https://i.pravatar.cc/80?u=Jane Smith",
    score: 950,
  },
  {
    rank: 3,
    name: "Alice Johnson",
    avatar: "https://i.pravatar.cc/80?u=Alice Johnson",
    score: 900,
  },
  {
    rank: 4,
    name: "Bob Brown",
    avatar: "https://i.pravatar.cc/80?u=Bob Brown",
    score: 850,
  },
  {
    rank: 5,
    name: "Charlie Davis",
    avatar: "https://i.pravatar.cc/80?u=Charlie Davis",
    score: 800,
  },
];

export const allTimeData: User[] = [
  {
    rank: 1,
    name: "John Doe",
    avatar: "https://i.pravatar.cc/80?u=John Doe",
    score: 1000,
  },
  {
    rank: 2,
    name: "Jane Smith",
    avatar: "https://i.pravatar.cc/80?u=Jane Smith",
    score: 950,
  },
  {
    rank: 3,
    name: "Alice Johnson",
    avatar: "https://i.pravatar.cc/80?u=Alice Johnson",
    score: 900,
  },
  {
    rank: 4,
    name: "Bob Brown",
    avatar: "https://i.pravatar.cc/80?u=Bob Brown",
    score: 850,
  },
  {
    rank: 5,
    name: "Charlie Davis",
    avatar: "https://i.pravatar.cc/80?u=Charlie Davis",
    score: 800,
  },
];

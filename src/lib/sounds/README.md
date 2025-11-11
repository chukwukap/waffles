# Sound System

A simple, efficient sound management system for the Waffles app.

## Features

- ✅ Automatic user preference handling (respects mute/unmute)
- ✅ Prevents sound overlap automatically
- ✅ Easy to add new sounds
- ✅ Simple React hooks for easy usage
- ✅ Supports both predefined sounds and dynamic URLs
- ✅ Automatic cleanup on component unmount

## Quick Start

### 1. Add a new sound

Edit `src/lib/sounds/config.ts`:

```typescript
export const SOUNDS = {
  // ... existing sounds
  myNewSound: {
    path: "/sounds/my-sound.ogg",
    volume: 0.7,
    loop: false,
  },
} as const;
```

### 2. Use in a component

```typescript
import { useSound } from "@/hooks/useSound";

function MyComponent() {
  const { play, stop } = useSound();
  
  const handleClick = () => {
    play("myNewSound");
  };
  
  return <button onClick={handleClick}>Click me</button>;
}
```

## API Reference

### `useSound()` Hook

Main hook for playing sounds.

```typescript
const { play, playUrl, stop, stopUrl, stopAll, soundEnabled } = useSound();
```

**Methods:**
- `play(name, options?)` - Play a predefined sound
- `playUrl(url, options?)` - Play a sound from URL
- `stop(name)` - Stop a predefined sound
- `stopUrl(url)` - Stop a URL sound
- `stopAll()` - Stop all sounds

**Example:**
```typescript
const { play } = useSound();
play("click", { volume: 0.8 });
```

### `useSoundEffect()` Hook

Play a sound when a value changes (e.g., question changes).

```typescript
useSoundEffect(questionId, "questionStart", { volume: 0.5 });
```

### `useSoundUrlEffect()` Hook

Play a URL sound when a value changes.

```typescript
useSoundUrlEffect(question?.soundUrl, { loop: true, volume: 1 });
```

## Examples

### Play sound on button click

```typescript
import { useSound } from "@/hooks/useSound";

function Button() {
  const { play } = useSound();
  
  return (
    <button onClick={() => play("click")}>
      Click me
    </button>
  );
}
```

### Play sound when data changes

```typescript
import { useSoundEffect } from "@/hooks/useSound";

function QuestionView({ questionId }) {
  // Automatically plays "questionStart" when questionId changes
  useSoundEffect(questionId, "questionStart");
  
  return <div>Question {questionId}</div>;
}
```

### Play looping background sound

```typescript
import { useSound } from "@/hooks/useSound";

function GameScreen() {
  const { play, stop } = useSound();
  
  useEffect(() => {
    play("roundBreak", { loop: true, volume: 0.4 });
    return () => stop("roundBreak");
  }, [play, stop]);
  
  return <div>Game Screen</div>;
}
```

### Play dynamic URL sound

```typescript
import { useSoundUrlEffect } from "@/hooks/useSound";

function QuestionView({ question }) {
  // Automatically plays question sound when question changes
  useSoundUrlEffect(question?.soundUrl, {
    loop: true,
    volume: 1,
  });
  
  return <div>{question.text}</div>;
}
```

## Architecture

- **`config.ts`** - Centralized sound definitions
- **`SoundManager.ts`** - Core sound management logic
- **`useSound.ts`** - React hooks for easy usage

## Best Practices

1. **Use hooks instead of direct SoundManager calls** - Hooks automatically handle preferences
2. **Use `useSoundEffect` for reactive sounds** - Automatically handles cleanup
3. **Always cleanup looping sounds** - Use `useEffect` cleanup or `useSoundEffect`
4. **Add sounds to config.ts** - Keeps all sound definitions in one place


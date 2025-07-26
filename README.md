# Pong Breaker

A modern take on the classic Pong game with multiple game modes, power-ups, and enhanced graphics.

## Features

- **Multiple Game Modes**: Classic Pong, Pong Breaker (brick-breaking), and Chaos Mode
- **Power-ups**: Multi-ball, speed boost, paddle extend, life up, freeze AI, and score bonus
- **Difficulty Levels**: Easy, Medium, Hard, and Insane
- **Real-time Statistics**: Track your performance with detailed stats
- **Achievement System**: Unlock achievements as you play
- **Modern UI**: Beautiful, responsive design with smooth animations

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository or download the files
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### Building for Production

Build the project for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Deployment

### Deploy to Vercel

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Vercel will automatically detect the Vite configuration and deploy your app

### Manual Deployment

1. Build the project: `npm run build`
2. Upload the contents of the `dist` folder to your hosting provider

## Controls

- **Mouse**: Move the left paddle
- **Space**: Pause/Resume game
- **R**: Reset game
- **Fullscreen**: Toggle fullscreen mode

## Game Modes

- **Classic Pong**: Traditional pong with infinite scoring
- **Pong Breaker**: Destroy bricks with limited lives
- **Chaos Mode**: Multi-ball mayhem with endless bricks

## Technologies Used

- HTML5 Canvas
- Vanilla JavaScript
- CSS3
- Vite (Build Tool)

## License

This project is open source and available under the [MIT License](LICENSE). 
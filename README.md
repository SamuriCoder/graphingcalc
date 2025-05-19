# Desmos-like Graphing Calculator

A powerful web-based graphing calculator with Desmos-like capabilities, built using React, TypeScript, and WebGL.

## Features

- Real-time 2D equation rendering
- Interactive sliders and animations
- Multiple graph layers
- Cross-platform responsiveness
- Advanced mathematical computations
- Touch gesture support

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

## Getting Started

1. Clone the repository:
```bash
git clone [repository-url]

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Development

### Project Structure

```
src/
├── components/     # React components
├── store/         # Redux store and slices
├── utils/         # Utility functions
├── workers/       # Web Workers
├── shaders/       # WebGL shaders
└── types/         # TypeScript type definitions
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Testing

- Unit tests: `npm run test`
- End-to-end tests: `npm run test:e2e`
- Coverage report: `npm run test:coverage`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Desmos Graphing Calculator
- Built with React, TypeScript, and WebGL
- Uses ANTLR4 for mathematical expression parsing
- Powered by MathJS for symbolic computation

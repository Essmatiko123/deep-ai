# AI Chat Studio

A comprehensive, feature-rich AI chat application built with Next.js 15, TypeScript, and Tailwind CSS. This application integrates multiple AI services including Pollinations, local models, and custom APIs with support for both text and image generation.

## Features

### 🤖 AI Model Integration
- **Pollinations API**: Free and open-source text and image generation
- **Local Model Support**: Integration with Ollama, LM Studio, and other local AI models
- **Custom API Support**: Add and configure custom API endpoints
- **MCP (Model Context Protocol)**: Support for standardized model interfaces

### 💬 Chat Features
- **Real-time Chat**: Smooth, responsive chat interface
- **Text & Image Generation**: Switch between text and image generation modes
- **File Attachments**: Support for file uploads and attachments
- **Message History**: Persistent chat history with timestamps
- **Export Functionality**: Export chat history as text files

### 🎨 Customization
- **Multiple Themes**: Light, dark, and system theme support
- **Responsive Design**: Mobile-first responsive layout
- **Customizable UI**: Adjustable chat width, bubble shapes, font sizes
- **Animation Controls**: Configurable animation speeds and motion reduction

### 🔧 Advanced Features
- **Puter.js Integration**: Cloud storage for chat history and generated images
- **Settings Persistence**: All settings saved to localStorage
- **Model Selection**: Dynamic model switching with shuffle functionality
- **API Configuration**: Comprehensive API endpoint management

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (New York style)
- **Icons**: Lucide React
- **API Integration**: Native fetch API with proxy routes

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-chat-studio
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

### Pollinations API
The application comes pre-configured with Pollinations API endpoints:
- Text Generation: `https://text.pollinations.ai/`
- Image Generation: `https://image.pollinations.ai/prompt/`

### Local Models

#### Ollama Setup
1. Install Ollama: [https://ollama.ai/](https://ollama.ai/)
2. Start Ollama server: `ollama serve`
3. Pull a model: `ollama pull llama2`
4. In the app settings, add a local model:
   - Name: `Ollama`
   - Endpoint: `http://localhost:11434`
   - Format: `ollama`
   - Type: `text`

#### LM Studio Setup
1. Install LM Studio: [https://lmstudio.ai/](https://lmstudio.ai/)
2. Start LM Studio and load a model
3. In the app settings, add a local model:
   - Name: `LM Studio`
   - Endpoint: `http://localhost:1234`
   - Format: `openai`
   - Type: `text`

#### Stable Diffusion WebUI
1. Install Stable Diffusion WebUI
2. Start the server
3. In the app settings, add a local model:
   - Name: `Stable Diffusion`
   - Endpoint: `http://localhost:7860`
   - Format: `custom`
   - Type: `image`

### Custom APIs

You can add custom API endpoints in the settings:

1. Go to Settings → APIs
2. Click "Add" under Custom APIs
3. Configure:
   - Name: Display name for the API
   - Endpoint: API URL
   - Type: Text, Image, or Both
   - Enabled: Toggle to enable/disable

### Puter.js Integration

1. Sign up for a Puter account at [https://puter.com/](https://puter.com/)
2. Get your API credentials
3. Enable Puter.js in Settings → APIs
4. Configure authentication if needed

## API Endpoints

The application includes several API routes:

### `/api/pollinations/text`
- Handles text generation via Pollinations API
- Supports GET and POST requests
- Parameters: `prompt`, `model`, `seed`, `temperature`, `max_tokens`

### `/api/pollinations/image`
- Handles image generation via Pollinations API
- Supports GET and POST requests
- Parameters: `prompt`, `model`, `seed`, `width`, `height`

### `/api/puter`
- Puter.js integration for file operations
- Actions: `upload`, `download`, `list`, `delete`, `createFolder`

### `/api/local`
- Local model integration with MCP support
- Actions: `generate`, `listModels`, `testConnection`

### `/api/proxy`
- Generic API proxy for custom endpoints
- Supports both GET and POST requests
- Handles JSON, text, and image responses

## Settings

### General Settings
- **Default Model**: Choose the default AI model
- **Theme**: Light, dark, or system theme
- **Font Size**: Small, medium, or large
- **Animation Speed**: Slow, normal, or fast
- **Show Timestamps**: Toggle message timestamps
- **Reduce Motion**: Disable animations for accessibility

### Appearance Settings
- **Chat Width**: Adjust chat container width
- **Bubble Shape**: Choose between rounded or square message bubbles

### API Settings
- **Custom APIs**: Add and manage custom API endpoints
- **Local Models**: Configure local AI model connections
- **Puter.js**: Enable cloud storage integration

### Advanced Settings
- **API Endpoints**: Configure default Pollinations endpoints
- **Generation Parameters**: Seed, temperature, max tokens
- **Model Configuration**: Advanced model settings

## Usage

### Basic Chat
1. Type your message in the input field
2. Press Enter or click Send to generate a response
3. Use the model selector to switch between different AI models
4. Click the shuffle button to randomly select a model

### Image Generation
1. Toggle to Image mode using the Text/Image buttons
2. Describe the image you want to generate
3. Press Enter or click Send
4. Generated images will appear in the chat

### File Attachments
1. Click the paperclip icon to attach files
2. Select files from your device (max 10MB per file)
3. Files will be sent with your message

### Export Chat
1. Click the download icon in the header
2. Chat history will be exported as a text file
3. File includes timestamps and message content

## Development

### Project Structure
```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── pollinations/ # Pollinations integration
│   │   ├── puter/        # Puter.js integration
│   │   ├── local/        # Local model integration
│   │   └── proxy/        # Generic API proxy
│   └── page.tsx          # Main application
├── components/
│   └── ui/               # shadcn/ui components
└── lib/
    ├── puter.ts          # Puter.js client utilities
    └── local-models.ts   # Local model utilities
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features
1. Create new API routes in `src/app/api/`
2. Add UI components in `src/components/`
3. Update the main page in `src/app/page.tsx`
4. Add utility functions in `src/lib/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:
1. Check the existing documentation
2. Review the API endpoint configurations
3. Test with different models and settings
4. Create an issue with detailed information

## Changelog

### v1.0.0
- Initial release with Pollinations integration
- Local model support (Ollama, LM Studio)
- Custom API configuration
- Puter.js integration
- Responsive design with theme support
- File attachment support
- Chat export functionality
- Comprehensive settings management
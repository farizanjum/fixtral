# Fixtral - AI Photoshop Assistant

*Version 0.2.0 - August 2025*

Fixtral is an AI-powered Photoshop assistant that automates image edits requested on Reddit's r/PhotoshopRequest using Google's Gemini AI models.

https://github.com/user-attachments/assets/32db6bad-13d9-461d-9158-35c78d1ea89c

## 🚀 Features

- **Automated Reddit Integration**: Fetches new posts from r/PhotoshopRequest with image attachments
- **AI-Powered Request Parsing**: Uses Gemini 2.5 Flash to parse natural language requests into structured edit forms
- **Intelligent Image Editing**: Leverages Fixtral (Gemini 2.5 Flash Image Preview) for automated image processing
- **Modern Dashboard UI**: Clean, responsive interface built with Next.js and shadcn/ui
- **Before/After Comparison**: Side-by-side or slider view for comparing edits
- **Download & Export**: Easy download of processed images
- **Processing History**: Track all completed and failed requests

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **UI Components**: shadcn/ui + Radix UI
- **Backend**: Next.js API Routes (Edge Runtime)
- **Reddit API**: snoowrap (JavaScript Reddit API client)
- **AI Models**:
  - **Gemini 2.5 Flash** → Text parsing and request understanding
  - **Fixtral (Gemini 2.5 Flash Image Preview)** → Image editing and generation
- **Icons**: Lucide React

### Core Workflow

1. **Fetch** → Reddit posts with images from r/PhotoshopRequest
2. **Parse** → Extract request text and convert to structured edit form using Gemini
3. **Edit** → Process images using Fixtral with the generated edit form
4. **Display** → Show before/after results in the dashboard

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Google AI API key (for Gemini models)
- Reddit API credentials (optional - uses mock data if not configured)

## 🛠️ Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd fixtral
npm install
```

2. **Configure environment variables:**

Create a `.env.local` file in the root directory:

```env
# Google AI (Gemini) Configuration
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Reddit API Configuration (optional - uses mock data if not set)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password

# Optional: Storage Configuration (for later)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your_s3_bucket_name
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Google AI Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` file

### Reddit API Setup (Optional)

1. Go to [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Create a new application (type: script)
3. Note your Client ID and Client Secret
4. Add Reddit credentials to `.env.local`

*Note: If Reddit credentials are not configured, the app will use mock data for demonstration.*

## 🎯 Usage

### Dashboard Overview

The app has three main sections:

1. **Queue** - View and process new Reddit requests
2. **Editor** - Review before/after comparisons
3. **History** - Browse processed requests

### Processing a Request

1. **Fetch Posts**: Click "Refresh Posts" in the Queue tab
2. **Select Request**: Browse available posts with images
3. **Parse & Edit**: Click the "Parse & Edit" button on any post
4. **Review Results**: Switch to Editor tab to see the processed image
5. **Download**: Save the edited image to your device

### Edit Form Structure

The AI parses requests into this structured format:

```json
{
  "task_type": "object_removal",
  "instructions": "Remove the man in the background",
  "objects_to_remove": ["man in background"],
  "objects_to_add": [],
  "style": "realistic",
  "mask_needed": true
}
```

## 🏗️ Project Structure

```
fixtral/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes
│   │   │   ├── reddit/        # Reddit integration
│   │   │   └── gemini/        # AI processing
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   │   └── app/               # Dashboard pages
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── queue-view.tsx    # Reddit posts queue
│   │   ├── editor-view.tsx   # Image editor/comparison
│   │   └── history-view.tsx  # Processing history
│   ├── lib/                  # Utilities and services
│   │   ├── database.ts       # Supabase integration
│   │   ├── auth-context.tsx  # Authentication
│   │   └── utils.ts          # Helper functions
│   └── types/                # TypeScript definitions
│       └── index.ts          # Type definitions
├── vercel.json               # Vercel deployment config
├── .vercelignore             # Files to exclude from Vercel build
├── supabase-schema.sql       # Database schema (reference)
└── README.md                 # Project documentation
```

## 🔌 API Endpoints

### Reddit Integration
- `GET /api/reddit/posts` - Fetch posts from r/PhotoshopRequest

### AI Processing
- `POST /api/gemini/parse` - Parse request text into edit form
- `POST /api/gemini/edit` - Process image with edit form

## 🎨 UI Components

Built with shadcn/ui components:
- `Card` - Post/request containers
- `Button` - Actions and interactions
- `Tabs` - Navigation between views
- `Table` - History and data display
- `Slider` - Before/after image comparison
- `Badge` - Status indicators

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform

## 🔮 Future Enhancements

- **Persistent Storage**: S3/Supabase for image storage
- **Database Integration**: Store processing history and user preferences
- **Batch Processing**: Process multiple requests simultaneously
- **Advanced Editing**: More sophisticated edit types and styles
- **User Authentication**: Multi-user support with access controls
- **Webhooks**: Real-time Reddit post notifications
- **Analytics**: Processing metrics and performance insights

## 📝 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting (via ESLint)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for powerful AI models
- [Reddit](https://www.reddit.com/) for the PhotoshopRequest community
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Next.js](https://nextjs.org/) for the React framework

---

*Built with ❤️ for the creative community*

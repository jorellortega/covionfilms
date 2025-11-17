import { Metadata } from 'next'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Film, TrendingUp, Users, Award, Zap, CheckCircle, Send } from "lucide-react"

export const metadata: Metadata = {
  title: 'Submit AI Content | Publish AI Movies & AI-Generated Films | COVION FILMS',
  description: 'Submit your AI-created content, AI movies, and AI-generated films to COVION FILMS. We\'re looking for innovative AI content creators to publish their work on our platform. Join the future of entertainment.',
  keywords: [
    'AI content',
    'AI movies',
    'AI-generated films',
    'publish AI content',
    'submit AI content',
    'AI content creators',
    'AI-generated movies',
    'AI film submission',
    'artificial intelligence content',
    'AI entertainment',
    'AI video content',
    'AI-generated entertainment',
    'AI content platform',
    'AI movie platform',
    'AI film distribution',
    'AI content publishing',
    'AI-generated video',
    'AI creative content',
    'AI storytelling',
    'AI filmmaking'
  ],
  openGraph: {
    title: 'Submit AI Content | Publish AI Movies & AI-Generated Films | COVION FILMS',
    description: 'Submit your AI-created content, AI movies, and AI-generated films to COVION FILMS. We\'re looking for innovative AI content creators to publish their work.',
    type: 'website',
    url: 'https://covionfilms.com/ai-content',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Submit AI Content | Publish AI Movies & AI-Generated Films | COVION FILMS',
    description: 'Submit your AI-created content, AI movies, and AI-generated films to COVION FILMS.',
  },
  alternates: {
    canonical: '/ai-content',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function AIContentPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-primary to-[#8e2de2] text-transparent bg-clip-text">
          Submit Your AI Content
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-6">
          We're looking for innovative creators to publish their AI-generated movies, films, and content on COVION FILMS
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Join the future of entertainment by sharing your AI-created content with a global audience. Whether you create AI movies, AI-generated films, or AI-powered entertainment, we want to showcase your work.
        </p>
      </div>

      {/* Why Submit Section */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Card className="bg-card/50 backdrop-blur-sm border border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <Zap className="h-6 w-6 text-cyan-400" />
              Why Submit AI Content to COVION?
            </CardTitle>
            <CardDescription>Join the leading platform for AI-generated entertainment</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-start">
                <CheckCircle className="mr-3 h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span><strong>Global Reach:</strong> Share your AI movies and AI-generated films with millions of viewers worldwide</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-3 h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span><strong>AI-First Platform:</strong> We specialize in showcasing AI content, AI movies, and AI-generated entertainment</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-3 h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span><strong>Monetization:</strong> Earn revenue from your AI-created content through our competitive sharing model</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-3 h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span><strong>Community:</strong> Connect with other AI content creators and filmmakers pushing the boundaries of AI-generated films</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-3 h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span><strong>Technology:</strong> Leverage our advanced streaming infrastructure optimized for AI content distribution</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <Film className="h-6 w-6 text-primary" />
              What We Accept
            </CardTitle>
            <CardDescription>Types of AI content we're looking for</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-start">
                <Film className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>AI Movies:</strong> Full-length AI-generated films and feature-length AI content</span>
              </li>
              <li className="flex items-start">
                <Film className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>AI Short Films:</strong> AI-generated short films and experimental AI storytelling</span>
              </li>
              <li className="flex items-start">
                <Film className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>AI Animations:</strong> AI-powered animated content and AI-generated visual stories</span>
              </li>
              <li className="flex items-start">
                <Film className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Hybrid Content:</strong> Content combining traditional filmmaking with AI-generated elements</span>
              </li>
              <li className="flex items-start">
                <Film className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>AI Documentaries:</strong> AI-curated or AI-enhanced documentary content</span>
              </li>
              <li className="flex items-start">
                <Film className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Experimental AI:</strong> Innovative AI-generated content pushing creative boundaries</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Benefits Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="bg-card/50 backdrop-blur-sm text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-gradient-to-r from-green-500 to-green-600">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-primary">Grow Your Audience</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Reach millions of viewers interested in AI content, AI movies, and AI-generated entertainment. Our platform is optimized for discovering innovative AI-created content.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-primary">Join AI Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Connect with a community of AI content creators, AI filmmakers, and innovators who are shaping the future of AI-generated entertainment.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600">
                <Award className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-primary">Get Recognized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Showcase your AI-generated films and AI content to industry professionals, critics, and entertainment enthusiasts worldwide.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-cyan-500/10 via-primary/10 to-[#8e2de2]/10 border-2 border-cyan-500/30 mb-12">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-primary text-transparent bg-clip-text">
            Ready to Submit Your AI Content?
          </CardTitle>
          <CardDescription className="text-lg">
            Start sharing your AI movies, AI-generated films, and AI-created content with the world
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Whether you're creating AI movies, AI-generated short films, AI animations, or experimental AI content, 
            COVION FILMS is the perfect platform to publish and distribute your AI-created work. 
            Join thousands of AI content creators who are revolutionizing entertainment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-primary text-white hover:from-cyan-600 hover:to-primary/90 w-full sm:w-auto">
              <Send className="mr-2 h-5 w-5" />
              Submit Your AI Content
            </Button>
            <Link href="/creator">
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white w-full sm:w-auto">
                Become a Creator
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* SEO Content Section */}
      <div className="prose prose-invert max-w-none mb-12">
        <div className="bg-card/30 rounded-lg p-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-primary">Publish Your AI Content on COVION FILMS</h2>
          <p className="text-muted-foreground mb-4">
            Are you an AI content creator looking to publish your AI movies, AI-generated films, or AI-created content? 
            COVION FILMS is the premier platform for AI content creators to submit and distribute their AI-generated entertainment.
          </p>
          <p className="text-muted-foreground mb-4">
            We accept a wide variety of AI content including AI movies, AI-generated short films, AI animations, 
            AI documentaries, and hybrid content that combines traditional filmmaking with AI technology. 
            Our platform is specifically designed to showcase and promote AI-generated entertainment to a global audience.
          </p>
          <p className="text-muted-foreground mb-4">
            As an AI content creator, you'll benefit from our advanced streaming infrastructure, 
            comprehensive analytics, and dedicated support for AI-generated content. Whether you're creating 
            full-length AI movies or experimental AI short films, we provide the tools and audience to help your work succeed.
          </p>
          <p className="text-muted-foreground">
            Join the growing community of AI filmmakers and content creators who are pushing the boundaries 
            of what's possible with AI-generated entertainment. Submit your AI content today and be part of 
            the future of filmmaking and entertainment.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-center text-primary">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">What types of AI content can I submit?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We accept AI movies, AI-generated films, AI short films, AI animations, AI documentaries, 
                and hybrid content that combines AI with traditional filmmaking. All AI-created content is welcome.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Do I need to be a creator to submit AI content?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Yes, you'll need to sign up as a creator first. You can apply through our creator page, 
                and once approved, you can start uploading your AI movies and AI-generated content.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">How do I submit my AI-generated films?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Once you're approved as a creator, simply go to the upload page and submit your AI content. 
                We support various formats and will help optimize your AI movies for streaming.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Can I monetize my AI content?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Yes! We offer competitive revenue sharing for AI content creators. Your AI movies and 
                AI-generated films can generate income based on views and engagement.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


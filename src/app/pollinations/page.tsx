'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Download, Share2, Sparkles, Image as ImageIcon, Settings, History, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface GenerationParams {
  prompt: string
  negativePrompt: string
  width: number
  height: number
  model: string
  seed: string
  steps: number
  guidanceScale: number
  safetyChecker: boolean
  enhance: boolean
  nologo: boolean
  private: boolean
}

interface GeneratedImage {
  url: string
  prompt: string
  params: GenerationParams
  timestamp: Date
}

const MODELS = [
  { value: 'flux', label: 'Flux', description: 'High-quality general purpose model' },
  { value: 'flux-pro', label: 'Flux Pro', description: 'Enhanced version with better quality' },
  { value: 'flux-dev', label: 'Flux Dev', description: 'Development version with experimental features' },
  { value: 'flux-schnell', label: 'Flux Schnell', description: 'Fast generation model' },
  { value: 'stable-diffusion', label: 'Stable Diffusion', description: 'Classic stable diffusion model' },
  { value: 'turbo', label: 'Turbo', description: 'Ultra-fast generation' }
]

const STYLE_PRESETS = [
  { name: 'Photorealistic', prompt: 'photorealistic, high detail, professional photography' },
  { name: 'Anime', prompt: 'anime style, manga, Japanese art style' },
  { name: 'Digital Art', prompt: 'digital art, illustration, modern art style' },
  { name: 'Oil Painting', prompt: 'oil painting, classical art, brush strokes' },
  { name: 'Watercolor', prompt: 'watercolor painting, soft colors, artistic' },
  { name: '3D Render', prompt: '3d render, octane render, detailed, cinematic' },
  { name: 'Pixel Art', prompt: 'pixel art, 8-bit, retro gaming style' },
  { name: 'Minimalist', prompt: 'minimalist, clean, simple design' }
]

const ASPECT_RATIOS = [
  { label: 'Square (1:1)', width: 512, height: 512 },
  { label: 'Portrait (4:5)', width: 512, height: 640 },
  { label: 'Landscape (5:4)', width: 640, height: 512 },
  { label: 'Widescreen (16:9)', width: 768, height: 432 },
  { label: 'Cinematic (21:9)', width: 896, height: 384 }
]

export default function PollinationsPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [activeTab, setActiveTab] = useState('generate')
  
  const [params, setParams] = useState<GenerationParams>({
    prompt: '',
    negativePrompt: '',
    width: 512,
    height: 512,
    model: 'flux',
    seed: '',
    steps: 20,
    guidanceScale: 7.5,
    safetyChecker: true,
    enhance: false,
    nologo: false,
    private: false
  })

  const updateParam = <K extends keyof GenerationParams>(key: K, value: GenerationParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }

  const generateImage = async () => {
    if (!params.prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Generation failed')
      }

      const data = await response.json()
      
      const newImage: GeneratedImage = {
        url: data.url,
        prompt: params.prompt,
        params: { ...params },
        timestamp: new Date()
      }

      setGeneratedImages(prev => [newImage, ...prev])
      toast.success('Image generated successfully!')
      
    } catch (error) {
      console.error('Generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pollinations-${prompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '-')}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Image downloaded successfully!')
    } catch (error) {
      toast.error('Failed to download image')
    }
  }

  const shareImage = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Generated Image',
          text: 'Check out this AI-generated image!',
          url: imageUrl
        })
      } catch (error) {
        toast.error('Failed to share image')
      }
    } else {
      navigator.clipboard.writeText(imageUrl)
      toast.success('Image URL copied to clipboard!')
    }
  }

  const applyStylePreset = (preset: typeof STYLE_PRESETS[0]) => {
    updateParam('prompt', `${params.prompt}, ${preset.prompt}`)
  }

  const applyAspectRatio = (ratio: typeof ASPECT_RATIOS[0]) => {
    updateParam('width', ratio.width)
    updateParam('height', ratio.height)
  }

  const randomizeSeed = () => {
    updateParam('seed', Math.random().toString(36).substring(7))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pt-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Builder
            </Button>
          </Link>
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <ImageIcon className="w-12 h-12 md:w-16 md:h-16 text-purple-600 dark:text-purple-400" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-pink-500 rounded-full animate-pulse" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Pollinations AI
              </h1>
              <div className="relative">
                <Sparkles className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Create stunning AI-generated images with Pollinations. Advanced controls, multiple models, and infinite possibilities.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Controls */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Prompt Configuration
                    </CardTitle>
                    <CardDescription>
                      Describe what you want to create. Be specific for better results.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="prompt" className="text-base font-medium">Prompt</Label>
                      <Textarea
                        id="prompt"
                        placeholder="A majestic dragon soaring through clouds at sunset, digital art style..."
                        value={params.prompt}
                        onChange={(e) => updateParam('prompt', e.target.value)}
                        className="mt-2 min-h-[100px] resize-none"
                      />
                    </div>

                    <div>
                      <Label htmlFor="negative-prompt" className="text-base font-medium">Negative Prompt</Label>
                      <Textarea
                        id="negative-prompt"
                        placeholder="blurry, low quality, distorted, ugly..."
                        value={params.negativePrompt}
                        onChange={(e) => updateParam('negativePrompt', e.target.value)}
                        className="mt-2 min-h-[60px] resize-none"
                      />
                    </div>

                    {/* Style Presets */}
                    <div>
                      <Label className="text-base font-medium mb-3 block">Style Presets</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {STYLE_PRESETS.map((preset) => (
                          <Button
                            key={preset.name}
                            variant="outline"
                            size="sm"
                            onClick={() => applyStylePreset(preset)}
                            className="text-xs"
                          >
                            {preset.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Aspect Ratios */}
                    <div>
                      <Label className="text-base font-medium mb-3 block">Aspect Ratio</Label>
                      <div className="flex flex-wrap gap-2">
                        {ASPECT_RATIOS.map((ratio) => (
                          <Button
                            key={ratio.label}
                            variant={params.width === ratio.width && params.height === ratio.height ? "default" : "outline"}
                            size="sm"
                            onClick={() => applyAspectRatio(ratio)}
                            className="text-xs"
                          >
                            {ratio.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Advanced Settings
                    </CardTitle>
                    <CardDescription>
                      Fine-tune your generation parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="model">Model</Label>
                        <Select value={params.model} onValueChange={(value) => updateParam('model', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MODELS.map((model) => (
                              <SelectItem key={model.value} value={model.value}>
                                <div>
                                  <div className="font-medium">{model.label}</div>
                                  <div className="text-xs text-gray-500">{model.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="seed">Seed (optional)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="seed"
                            placeholder="Random"
                            value={params.seed}
                            onChange={(e) => updateParam('seed', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={randomizeSeed}
                            title="Randomize seed"
                          >
                            <Sparkles className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label>Steps: {params.steps}</Label>
                          <span className="text-sm text-gray-500">Higher = more detail</span>
                        </div>
                        <Slider
                          value={[params.steps]}
                          onValueChange={([value]) => updateParam('steps', value)}
                          min={1}
                          max={50}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <Label>Guidance Scale: {params.guidanceScale.toFixed(1)}</Label>
                          <span className="text-sm text-gray-500">How closely to follow prompt</span>
                        </div>
                        <Slider
                          value={[params.guidanceScale]}
                          onValueChange={([value]) => updateParam('guidanceScale', value)}
                          min={1}
                          max={20}
                          step={0.5}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="safety-checker"
                          checked={params.safetyChecker}
                          onCheckedChange={(checked) => updateParam('safetyChecker', checked)}
                        />
                        <Label htmlFor="safety-checker">Safety Checker</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="enhance"
                          checked={params.enhance}
                          onCheckedChange={(checked) => updateParam('enhance', checked)}
                        />
                        <Label htmlFor="enhance">Enhance Quality</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="nologo"
                          checked={params.nologo}
                          onCheckedChange={(checked) => updateParam('nologo', checked)}
                        />
                        <Label htmlFor="nologo">No Watermark</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="private"
                          checked={params.private}
                          onCheckedChange={(checked) => updateParam('private', checked)}
                        />
                        <Label htmlFor="private">Private Generation</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Generate</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={generateImage}
                      disabled={isGenerating || !params.prompt.trim()}
                      className="w-full h-12 text-base"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generate Image
                        </>
                      )}
                    </Button>

                    <div className="text-sm text-gray-500 space-y-1">
                      <p>• Be descriptive in your prompt</p>
                      <p>• Use negative prompts to avoid unwanted elements</p>
                      <p>• Experiment with different models</p>
                      <p>• Higher steps = more detail but slower</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Generation Preview */}
                {generatedImages.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Latest Generation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="relative group">
                          <img
                            src={generatedImages[0].url}
                            alt="Generated image"
                            className="w-full rounded-lg shadow-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => downloadImage(generatedImages[0].url, generatedImages[0].prompt)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => shareImage(generatedImages[0].url)}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm">
                          <p className="font-medium truncate">{generatedImages[0].prompt}</p>
                          <div className="flex gap-1 mt-2 flex-wrap">
                            <Badge variant="secondary">{generatedImages[0].params.model}</Badge>
                            <Badge variant="secondary">{generatedImages[0].params.width}×{generatedImages[0].params.height}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gallery">
            <Card>
              <CardHeader>
                <CardTitle>Image Gallery</CardTitle>
                <CardDescription>
                  Your generated images collection
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedImages.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No images generated yet</p>
                    <p className="text-sm text-gray-400 mt-2">Start creating to see your gallery here</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {generatedImages.map((image, index) => (
                      <div key={index} className="group relative">
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-48 object-cover rounded-lg shadow-md"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => downloadImage(image.url, image.prompt)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => shareImage(image.url)}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium truncate">{image.prompt}</p>
                          <p className="text-xs text-gray-500">
                            {image.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Generation History</CardTitle>
                <CardDescription>
                  Detailed history of all your generations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedImages.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No generation history yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {generatedImages.map((image, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex gap-4">
                          <img
                            src={image.url}
                            alt={image.prompt}
                            className="w-20 h-20 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{image.prompt}</p>
                            <p className="text-sm text-gray-500 mb-2">
                              {image.timestamp.toLocaleString()}
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline">{image.params.model}</Badge>
                              <Badge variant="outline">{image.params.width}×{image.params.height}</Badge>
                              <Badge variant="outline">Steps: {image.params.steps}</Badge>
                              <Badge variant="outline">Scale: {image.params.guidanceScale}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadImage(image.url, image.prompt)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => shareImage(image.url)}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
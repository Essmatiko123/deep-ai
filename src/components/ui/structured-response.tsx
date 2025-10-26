'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code2, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check,
  Terminal,
  FileJson,
  FileCode,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface CodeBlock {
  language: string;
  code: string;
  title?: string;
}

interface StructuredContent {
  text: string;
  codeBlocks: CodeBlock[];
  jsonBlocks: Array<{
    title?: string;
    content: string;
  }>;
  lists: Array<{
    type: 'ordered' | 'unordered';
    items: string[];
  }>;
}

interface StructuredResponseProps {
  content: string;
  isPreview?: boolean;
}

export function StructuredResponse({ content, isPreview = false }: StructuredResponseProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [showPreview, setShowPreview] = useState(true);

  const parseStructuredContent = (text: string): StructuredContent => {
    const codeBlocks: CodeBlock[] = [];
    const jsonBlocks: Array<{ title?: string; content: string }> = [];
    const lists: Array<{ type: 'ordered' | 'unordered'; items: string[] }> = [];
    
    let processedText = text;

    // Extract code blocks
    const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let codeMatch;
    while ((codeMatch = codeRegex.exec(text)) !== null) {
      const language = codeMatch[1] || 'text';
      const code = codeMatch[2].trim();
      const title = `Code (${language})`;
      
      codeBlocks.push({ language, code, title });
      processedText = processedText.replace(codeMatch[0], `[CODE_BLOCK_${codeBlocks.length - 1}]`);
    }

    // Extract JSON blocks
    const jsonRegex = /\{[\s\S]*?\}/g;
    let jsonMatch;
    while ((jsonMatch = jsonRegex.exec(text)) !== null) {
      try {
        JSON.parse(jsonMatch[0]);
        jsonBlocks.push({ title: 'JSON Data', content: jsonMatch[0] });
        processedText = processedText.replace(jsonMatch[0], `[JSON_BLOCK_${jsonBlocks.length - 1}]`);
      } catch {
        // Not valid JSON, skip
      }
    }

    // Extract lists
    const orderedListRegex = /^\d+\.\s+(.+)$/gm;
    const unorderedListRegex = /^[-*+]\s+(.+)$/gm;
    
    let orderedMatch;
    while ((orderedMatch = orderedListRegex.exec(processedText)) !== null) {
      const items: string[] = [];
      let currentMatch = orderedMatch;
      while (currentMatch) {
        items.push(currentMatch[1]);
        currentMatch = orderedListRegex.exec(processedText);
      }
      if (items.length > 1) {
        lists.push({ type: 'ordered', items });
        processedText = processedText.replace(/^\d+\.\s+.+$/gm, '[ORDERED_LIST]');
      }
    }

    let unorderedMatch;
    while ((unorderedMatch = unorderedListRegex.exec(processedText)) !== null) {
      const items: string[] = [];
      let currentMatch = unorderedMatch;
      while (currentMatch) {
        items.push(currentMatch[1]);
        currentMatch = unorderedListRegex.exec(processedText);
      }
      if (items.length > 1) {
        lists.push({ type: 'unordered', items });
        processedText = processedText.replace(/^[-*+]\s+.+$/gm, '[UNORDERED_LIST]');
      }
    }

    return {
      text: processedText,
      codeBlocks,
      jsonBlocks,
      lists
    };
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      toast.success('Copied to clipboard');
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const toggleBlockExpansion = (id: string) => {
    setExpandedBlocks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getLanguageIcon = (language: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      javascript: <FileCode className="h-4 w-4" />,
      typescript: <FileCode className="h-4 w-4" />,
      python: <Terminal className="h-4 w-4" />,
      json: <FileJson className="h-4 w-4" />,
      html: <Code2 className="h-4 w-4" />,
      css: <FileCode className="h-4 w-4" />,
      default: <Code2 className="h-4 w-4" />
    };
    return iconMap[language.toLowerCase()] || iconMap.default;
  };

  const structured = parseStructuredContent(content);

  if (structured.codeBlocks.length === 0 && structured.jsonBlocks.length === 0) {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preview Toggle */}
      {(structured.codeBlocks.length > 0 || structured.jsonBlocks.length > 0) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {structured.codeBlocks.length + structured.jsonBlocks.length} code blocks
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
        </div>
      )}

      {showPreview && (
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code Blocks</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            {/* Main text content */}
            <Card>
              <CardContent className="p-4">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap">{structured.text}</div>
                </div>
              </CardContent>
            </Card>

            {/* Render lists */}
            {structured.lists.map((list, index) => (
              <Card key={`list-${index}`}>
                <CardContent className="p-4">
                  <div className={`list-${list.type} pl-4`}>
                    {list.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="py-1">
                        {list.type === 'ordered' ? `${itemIndex + 1}. ` : '• '}
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="code" className="space-y-4">
            {/* Code Blocks */}
            {structured.codeBlocks.map((block, index) => {
              const blockId = `code-${index}`;
              const isExpanded = expandedBlocks[blockId] !== false;
              
              return (
                <Card key={blockId}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getLanguageIcon(block.language)}
                        <CardTitle className="text-sm">{block.title}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {block.language}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(block.code, blockId)}
                        >
                          {copiedStates[blockId] ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleBlockExpansion(blockId)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="pt-0">
                      <ScrollArea className="h-64 w-full rounded-md border">
                        <pre className="p-4 text-sm bg-muted/50">
                          <code className={`language-${block.language}`}>
                            {block.code}
                          </code>
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  )}
                </Card>
              );
            })}

            {/* JSON Blocks */}
            {structured.jsonBlocks.map((block, index) => {
              const blockId = `json-${index}`;
              const isExpanded = expandedBlocks[blockId] !== false;
              
              return (
                <Card key={blockId}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4" />
                        <CardTitle className="text-sm">{block.title}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          JSON
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(block.content, blockId)}
                        >
                          {copiedStates[blockId] ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleBlockExpansion(blockId)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="pt-0">
                      <ScrollArea className="h-64 w-full rounded-md border">
                        <pre className="p-4 text-sm bg-muted/50">
                          <code className="language-json">
                            {JSON.stringify(JSON.parse(block.content), null, 2)}
                          </code>
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
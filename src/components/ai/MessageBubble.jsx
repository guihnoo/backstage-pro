import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Copy, Zap, CheckCircle2, AlertCircle, Loader2, ChevronRight, Clock, User } from 'lucide-react';
import { cn } from "@/lib/utils";
import appToast from '@/lib/appToast';
import { useCategoryTheme } from '@/lib/useCategoryTheme';


const FunctionDisplay = ({ toolCall }) => {
    const [expanded, setExpanded] = useState(false);
    const status = toolCall?.status || 'pending';
    const results = toolCall?.results;
    
    // Parse and check for errors
    const parsedResults = (() => {
        if (!results) return null;
        try {
            return typeof results === 'string' ? JSON.parse(results) : results;
        } catch {
            return results;
        }
    })();
    
    const isError = results && (
        (typeof results === 'string' && /error|failed/i.test(results)) ||
        (parsedResults?.success === false)
    );
    
    // Status configuration
    const statusConfig = {
        pending: { icon: Clock, color: 'text-[#a8a8a8]', text: 'Pendente' },
        running: { icon: Loader2, color: 'text-[#888888]', text: 'Executando...', spin: true },
        in_progress: { icon: Loader2, color: 'text-[#888888]', text: 'Executando...', spin: true },
        completed: isError ? 
            { icon: AlertCircle, color: 'text-[#ff2e88]', text: 'Falhou' } : 
            { icon: CheckCircle2, color: 'text-green-600', text: 'Sucesso' },
        success: { icon: CheckCircle2, color: 'text-green-600', text: 'Sucesso' },
        failed: { icon: AlertCircle, color: 'text-[#ff2e88]', text: 'Falhou' },
        error: { icon: AlertCircle, color: 'text-[#ff2e88]', text: 'Falhou' }
    }[status] || { icon: Zap, color: 'text-[#888888]', text: '' };
    
    const Icon = statusConfig.icon;
    
    return (
        <div className="mt-2 text-xs">
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
                    "hover:bg-[#1f1f1f]",
                    expanded ? "bg-[#1f1f1f] border-[#2a2a2a]" : "bg-[#161616] border-[#2a2a2a]"
                )}
            >
                <Icon className={cn("h-3 w-3", statusConfig.color, statusConfig.spin && "animate-spin")} />
                <span className="text-[#c8c8c8]">{statusConfig.text}</span>
                {!statusConfig.spin && (toolCall.arguments_string || results) && (
                    <ChevronRight className={cn("h-3 w-3 text-[#a8a8a8] transition-transform ml-auto", 
                        expanded && "rotate-90")} />
                )}
            </button>
            
            {expanded && !statusConfig.spin && (
                <div className="mt-1.5 ml-3 pl-3 border-l-2 border-[#2a2a2a] space-y-2">
                    {toolCall.arguments_string && (
                        <div>
                            <div className="text-xs text-[#888888] mb-1">Parâmetros:</div>
                            <pre className="bg-[#1f1f1f] rounded-md p-2 text-xs text-[#a8a8a8] whitespace-pre-wrap">
                                {(() => {
                                    try {
                                        return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2);
                                    } catch {
                                        return toolCall.arguments_string;
                                    }
                                })()}
                            </pre>
                        </div>
                    )}
                    {parsedResults && (
                        <div>
                            <div className="text-xs text-[#888888] mb-1">Resultado:</div>
                            <pre className="bg-[#1f1f1f] rounded-md p-2 text-xs text-[#a8a8a8] whitespace-pre-wrap max-h-48 overflow-auto">
                                {typeof parsedResults === 'object' ? 
                                    JSON.stringify(parsedResults, null, 2) : parsedResults}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    const { primaryHex, accentHex } = useCategoryTheme();
    const linkColor = primaryHex;
    const avatarGradient = `linear-gradient(to bottom right, ${primaryHex}, ${accentHex})`;
    
    return (
        <div className={cn("flex gap-3 my-4", isUser ? "justify-end" : "justify-start")}>
            {!isUser && (
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: avatarGradient }}
                >
                    <Zap className="h-4 w-4 text-white" />
                </div>
            )}
            <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end")}>
                {message.content && (
                    <div className={cn(
                        "rounded-2xl px-4 py-2.5",
                        isUser ? "bg-slate-200 text-slate-800" : "bg-[#1f1f1f] text-[#e0e0e0] border border-[#2a2a2a]"
                    )}>
                        {isUser ? (
                            <p className="text-sm leading-relaxed">{message.content}</p>
                        ) : (
                            <ReactMarkdown 
                                className="text-sm prose prose-sm prose-slate max-w-none prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                                components={{
                                    code: ({ inline, className, children, ...props }) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <div className="relative group/code">
                                                <pre className="bg-[#161616] text-[#f0f0f0] rounded-lg p-3 overflow-x-auto my-2">
                                                    <code className={className} {...props}>{children}</code>
                                                </pre>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover/code:opacity-100 bg-[#1f1f1f] hover:bg-[#2a2a2a]"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                                        appToast.success('Código copiado');
                                                    }}
                                                    aria-label="Copiar código"
                                                >
                                                    <Copy className="h-3 w-3 text-[#a8a8a8]" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <code className="px-1 py-0.5 rounded bg-[#2a2a2a] text-[#c8c8c8] text-xs">
                                                {children}
                                            </code>
                                        );
                                    },
                                    a: ({ children, ...props }) => (
                                        <a {...props} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: linkColor }}>{children}</a>
                                    ),
                                    p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                                    ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                                    ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                                    li: ({ children }) => <li className="my-0.5">{children}</li>,
                                    h1: ({ children }) => <h1 className="text-lg font-semibold my-2">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-base font-semibold my-2">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-sm font-semibold my-2">{children}</h3>,
                                    blockquote: ({ children }) => (
                                        <blockquote className="border-l-2 border-[#2a2a2a] pl-3 my-2 text-[#a8a8a8]">
                                            {children}
                                        </blockquote>
                                    ),
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        )}
                    </div>
                )}
                
                {message.tool_calls?.length > 0 && (
                    <div className="space-y-1 w-full mt-2">
                        {message.tool_calls.map((toolCall, idx) => (
                            <FunctionDisplay key={idx} toolCall={toolCall} />
                        ))}
                    </div>
                )}
            </div>
             {isUser && (
                <div className="h-8 w-8 rounded-lg bg-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5 ml-3">
                    <User className="h-4 w-4 text-[#666666]" />
                </div>
            )}
        </div>
    );
}
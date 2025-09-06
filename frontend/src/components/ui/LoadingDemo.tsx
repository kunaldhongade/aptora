import React, { useState } from 'react';
import { LoadingAnimation } from './LoadingAnimation';

export const LoadingDemo: React.FC = () => {
    const [activeVariant, setActiveVariant] = useState<'spinner' | 'pulse' | 'wave' | 'dots' | 'shadow'>('shadow');

    const variants = [
        { key: 'shadow', label: 'Shadow (Default)', description: 'Beautiful glowing orb with floating particles' },
        { key: 'spinner', label: 'Spinner', description: 'Classic rotating border animation' },
        { key: 'pulse', label: 'Pulse', description: 'Breathing scale and opacity effect' },
        { key: 'wave', label: 'Wave', description: 'Animated bars with wave motion' },
        { key: 'dots', label: 'Dots', description: 'Three dots with sequential scaling' }
    ] as const;

    return (
        <div className="p-8 bg-bg-900 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8 text-center">
                    🎨 Loading Animation Showcase
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {variants.map((variant) => (
                        <button
                            key={variant.key}
                            onClick={() => setActiveVariant(variant.key)}
                            className={`p-4 rounded-lg border-2 transition-all ${activeVariant === variant.key
                                    ? 'border-primary bg-primary/10'
                                    : 'border-surface-600 bg-surface-800 hover:border-surface-500'
                                }`}
                        >
                            <h3 className="font-semibold text-white mb-2">{variant.label}</h3>
                            <p className="text-sm text-muted">{variant.description}</p>
                        </button>
                    ))}
                </div>

                <div className="bg-surface-800 rounded-xl p-8 border border-surface-600">
                    <h2 className="text-xl font-semibold text-white mb-6 text-center">
                        Current Animation: {variants.find(v => v.key === activeVariant)?.label}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Small */}
                        <div className="text-center">
                            <h3 className="text-sm font-medium text-muted mb-4">Small</h3>
                            <LoadingAnimation
                                size="sm"
                                variant={activeVariant}
                                text="Loading..."
                            />
                        </div>

                        {/* Medium */}
                        <div className="text-center">
                            <h3 className="text-sm font-medium text-muted mb-4">Medium</h3>
                            <LoadingAnimation
                                size="md"
                                variant={activeVariant}
                                text="Loading..."
                            />
                        </div>

                        {/* Large */}
                        <div className="text-center">
                            <h3 className="text-sm font-medium text-muted mb-4">Large</h3>
                            <LoadingAnimation
                                size="lg"
                                variant={activeVariant}
                                text="Loading..."
                            />
                        </div>

                        {/* Extra Large */}
                        <div className="text-center">
                            <h3 className="text-sm font-medium text-muted mb-4">Extra Large</h3>
                            <LoadingAnimation
                                size="xl"
                                variant={activeVariant}
                                text="Loading..."
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-surface-800 rounded-xl p-6 border border-surface-600">
                    <h3 className="text-lg font-semibold text-white mb-4">Usage Examples</h3>
                    <div className="space-y-4 text-sm text-muted">
                        <div>
                            <code className="text-primary">PageLoading</code> - Full screen loading for route changes
                        </div>
                        <div>
                            <code className="text-primary">CardLoading</code> - Loading for content cards and sections
                        </div>
                        <div>
                            <code className="text-primary">InlineLoading</code> - Small loading for inline content
                        </div>
                        <div>
                            <code className="text-primary">LoadingAnimation</code> - Custom loading with full control
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import TradingViewChart from './TradingViewChart';

const TradingViewDemo: React.FC = () => {
    const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDC');
    const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('dark');

    const symbols = [
        { value: 'BTC/USDC', label: 'Bitcoin (BTC/USDC)' },
        { value: 'ETH/USDC', label: 'Ethereum (ETH/USDC)' },
        { value: 'APT/USDC', label: 'Aptos (APT/USDC)' },
        { value: 'SOL/USDC', label: 'Solana (SOL/USDC)' },
    ];

    return (
        <div className="space-y-6">
            {/* Demo Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">TradingView Chart Integration</h2>
                <p className="text-gray-400">Professional trading charts with real-time data</p>
            </div>

            {/* Controls */}
            <Card>
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Chart Controls</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Select Symbol
                            </label>
                            <select
                                value={selectedSymbol}
                                onChange={(e) => setSelectedSymbol(e.target.value)}
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {symbols.map((symbol) => (
                                    <option key={symbol.value} value={symbol.value}>
                                        {symbol.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Theme
                            </label>
                            <select
                                value={selectedTheme}
                                onChange={(e) => setSelectedTheme(e.target.value as 'light' | 'dark')}
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="dark">Dark Theme</option>
                                <option value="light">Light Theme</option>
                            </select>
                        </div>
                    </div>
                </div>
            </Card>

            {/* TradingView Chart */}
            <TradingViewChart
                symbol={selectedSymbol}
                theme={selectedTheme}
                height="600px"
                showToolbar={true}
                showVolume={true}
                showDetails={true}
                onSymbolChange={(symbol) => {
                    console.log('Symbol changed to:', symbol);
                    setSelectedSymbol(symbol);
                }}
                className="rounded-2xl overflow-hidden"
            />

            {/* Features List */}
            <Card>
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Chart Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-300">Real-time data</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-300">Multiple timeframes</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-gray-300">Technical indicators</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-gray-300">Drawing tools</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-gray-300">Volume analysis</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            <span className="text-gray-300">Fullscreen mode</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default TradingViewDemo;

import { memo, useEffect, useRef } from 'react';

interface TradingViewChartProps {
    symbol?: string;
    interval?: string;
    theme?: 'light' | 'dark';
    height?: string | number;
    width?: string | number;
    className?: string;
    fillParent?: boolean; // New prop to make chart fill parent container
}

// Symbol mapping for TradingView format
const SYMBOL_MAP: Record<string, string> = {
    'APT/USDC': 'COINBASE:APTUSD',
    'BTC/USDC': 'CRYPTO:BTCUSD',
    'ETH/USDC': 'CRYPTO:ETHUSD',
    'SOL/USDC': 'CRYPTO:SOLUSD',
    'APT-USDC': 'COINBASE:APTUSD',
    'BTC-USDC': 'CRYPTO:BTCUSD',
    'ETH-USDC': 'CRYPTO:ETHUSD',
    'SOL-USDC': 'CRYPTO:SOLUSD',
};

function TradingViewChart({
    symbol = 'CRYPTO:BTCUSD',
    interval = 'D',
    theme = 'dark',
    height = '500px',
    width = '100%',
    className = '',
    fillParent = false,
}: TradingViewChartProps) {
    const container = useRef<HTMLDivElement>(null);

    // Convert symbol to TradingView format
    const getTradingViewSymbol = (symbol: string): string => {
        return SYMBOL_MAP[symbol] || `CRYPTO:${symbol.replace('/', '').replace('-', '')}USD`;
    };

    useEffect(() => {
        const containerElement = container.current;
        if (!containerElement) return;

        // Clear existing content completely
        containerElement.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
        script.type = 'text/javascript';
        script.async = true;

        const tradingViewSymbol = getTradingViewSymbol(symbol);

        script.innerHTML = JSON.stringify({
            allow_symbol_change: true,
            autosize: true,
            calendar: false,
            details: false,
            hide_side_toolbar: false,
            hide_top_toolbar: false,
            hide_legend: false,
            hide_volume: false,
            hotlist: false,
            interval: interval,
            locale: 'en',
            save_image: true,
            style: '1',
            symbol: tradingViewSymbol,
            theme: theme,
            timezone: 'Etc/UTC',
            backgroundColor: theme === 'dark' ? '#000000' : '#FFFFFF',
            gridColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(242, 242, 242, 0.5)',
            watchlist: [],
            withdateranges: true,
            compareSymbols: [],
            studies: [],
            container_id: `tradingview_${Date.now()}_${Math.random()}`,
        });

        containerElement.appendChild(script);

        return () => {
            // Clean up script when component unmounts or dependencies change
            if (containerElement && script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [symbol, interval, theme]);

    // Calculate dynamic styles
    const containerStyle = fillParent
        ? {
            height: '100%',
            width: '100%',
            minHeight: '400px' // Ensure minimum height for usability
        }
        : {
            height,
            width
        };

    return (
        <div
            className={`tradingview-widget-container ${className}`}
            style={containerStyle}
        >
            <div
                ref={container}
                className="tradingview-widget-container__widget"
                style={{
                    height: fillParent ? 'calc(100% - 20px)' : '100%',
                    width: '100%'
                }}
            />
            <div className="tradingview-widget-copyright" style={{ height: '20px', fontSize: '12px' }}>
                <a
                    href={`https://www.tradingview.com/symbols/${symbol.replace(':', '-')}/?exchange=CRYPTO`}
                    rel="noopener nofollow"
                    target="_blank"
                >
                    <span className="text-muted hover:text-accent transition-colors">{symbol} chart by TradingView</span>
                </a>
            </div>
        </div>
    );
}

export default memo(TradingViewChart);

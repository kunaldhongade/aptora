import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Clock, TrendingDown, TrendingUp, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { CardLoading } from '../components/ui/LoadingAnimation';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';

interface Order {
    id: string;
    market_id: string;
    side: string;
    order_type: string;
    quantity: number;
    price?: number;
    status: string;
    filled_quantity: number;
    average_price?: number;
    leverage?: number;
    margin_type?: string;
    created_at: string;
}

interface Position {
    id: string;
    market_id: string;
    side: string;
    size: number;
    entry_price: number;
    mark_price: number;
    unrealized_pnl: number;
    realized_pnl: number;
    leverage: number;
    margin: number;
    liquidation_price?: number;
    created_at: string;
}

export const Orders: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'orders' | 'positions'>('orders');
    const [orders, setOrders] = useState<Order[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (!user?.wallet_address) {
                setError('Wallet not connected. Please connect your wallet to view orders and positions.');
                return;
            }

            if (activeTab === 'orders') {
                const ordersData = await apiClient.getOpenOrders(user.wallet_address);
                setOrders(ordersData as Order[]);
            } else {
                const positionsData = await apiClient.getPositions(user.wallet_address);
                setPositions(positionsData as Position[]);
            }
        } catch (err) {
            setError('Failed to load data');
            console.error('Error loading data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, activeTab]);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, activeTab, loadData]);

    const handleCancelOrder = async (orderId: string) => {
        try {
            await apiClient.cancelOrder(orderId);
            await loadData(); // Refresh orders
        } catch (err) {
            console.error('Failed to cancel order:', err);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'filled': return 'text-success';
            case 'pending': return 'text-warning';
            case 'cancelled': return 'text-muted';
            case 'rejected': return 'text-danger';
            default: return 'text-text-default';
        }
    };

    const getSideColor = (side: string) => {
        return side.toLowerCase() === 'buy' ? 'text-success' : 'text-danger';
    };

    const getSideIcon = (side: string) => {
        return side.toLowerCase() === 'buy' ? TrendingUp : TrendingDown;
    };

    const renderOrders = () => (
        <div className="space-y-4">
            {orders.length === 0 ? (
                <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-text-default mb-2">No Orders</h3>
                    <p className="text-muted">You haven't placed any orders yet.</p>
                </div>
            ) : (
                orders.map((order) => {
                    const SideIcon = getSideIcon(order.side);
                    return (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface-700 rounded-xl p-4 border border-surface-600"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={clsx('p-2 rounded-lg', getSideColor(order.side), 'bg-surface-600')}>
                                        <SideIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-text-default">Order #{order.id.slice(0, 8)}</h3>
                                        <p className="text-sm text-muted">{order.order_type.toUpperCase()} Order</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={clsx('text-sm font-medium', getStatusColor(order.status))}>
                                        {order.status.toUpperCase()}
                                    </span>
                                    {order.status.toLowerCase() === 'pending' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCancelOrder(order.id)}
                                            className="ml-2 text-danger hover:text-danger"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                                <div>
                                    <p className="text-muted">Size</p>
                                    <p className="font-mono">{order.quantity}</p>
                                </div>
                                <div>
                                    <p className="text-muted">Price</p>
                                    <p className="font-mono">
                                        {order.price ? `$${order.price.toFixed(2)}` : 'Market'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted">Filled</p>
                                    <p className="font-mono">{order.filled_quantity}</p>
                                </div>
                                <div>
                                    <p className="text-muted">Created</p>
                                    <p className="font-mono text-xs">{formatDate(order.created_at)}</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })
            )}
        </div>
    );

    const renderPositions = () => (
        <div className="space-y-4">
            {positions.length === 0 ? (
                <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-text-default mb-2">No Positions</h3>
                    <p className="text-muted">You don't have any open positions.</p>
                </div>
            ) : (
                positions.map((position) => {
                    const SideIcon = getSideIcon(position.side);
                    const isProfit = position.unrealized_pnl > 0;
                    const pnlPercentage = position.entry_price > 0 ? (position.unrealized_pnl / (position.entry_price * position.size)) * 100 : 0;

                    return (
                        <motion.div
                            key={position.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface-700 rounded-xl p-4 border border-surface-600"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={clsx('p-2 rounded-lg', getSideColor(position.side), 'bg-surface-600')}>
                                        <SideIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-text-default">Position #{position.id.slice(0, 8)}</h3>
                                        <p className="text-sm text-muted">{position.side.toUpperCase()} Position</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={clsx('text-lg font-bold', isProfit ? 'text-success' : 'text-danger')}>
                                        {isProfit ? '+' : ''}${position.unrealized_pnl.toFixed(2)}
                                    </p>
                                    <p className={clsx('text-sm', isProfit ? 'text-success' : 'text-danger')}>
                                        {isProfit ? '+' : ''}{pnlPercentage.toFixed(2)}%
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                                <div>
                                    <p className="text-muted">Size</p>
                                    <p className="font-mono">{position.size}</p>
                                </div>
                                <div>
                                    <p className="text-muted">Entry Price</p>
                                    <p className="font-mono">${position.entry_price.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-muted">Mark Price</p>
                                    <p className="font-mono">${position.mark_price.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-muted">Leverage</p>
                                    <p className="font-mono">{position.leverage}x</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })
            )}
        </div>
    );

    return (
        <div className="w-full max-w-none space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-default mb-2">Orders & Positions</h1>
                <p className="text-muted">Manage your trading orders and view open positions.</p>
            </div>

            {/* Tabs */}
            <div className="flex bg-surface-700 rounded-lg p-1 border border-surface-600">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={clsx(
                        'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
                        activeTab === 'orders'
                            ? 'bg-primary text-black shadow-glow'
                            : 'text-muted hover:text-text-default'
                    )}
                >
                    Orders
                </button>
                <button
                    onClick={() => setActiveTab('positions')}
                    className={clsx(
                        'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
                        activeTab === 'positions'
                            ? 'bg-primary text-black shadow-glow'
                            : 'text-muted hover:text-text-default'
                    )}
                >
                    Positions
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-danger/20 border border-danger/30 rounded-lg text-danger">
                    {error}
                </div>
            )}

            {/* Content */}
            {isLoading ? (
                <CardLoading text="Loading orders and positions..." />
            ) : (
                activeTab === 'orders' ? renderOrders() : renderPositions()
            )}
        </div>
    );
};

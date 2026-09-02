import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AlertTriangle, CheckCircle, RefreshCw, XCircle, Sparkles, Bot, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

interface AISuggestion {
  exception_id: string;
  order_id: string;
  summary: string;
  suggested_action: string;
  recommended_depot_id: string;
  recommended_depot_name: string;
  confidence_score: number;
  reasoning: string;
  requires_human_approval: boolean;
}

const AdminExceptions: React.FC = () => {
  const { exceptions, orders, depots, reassignOrderDepot, currentUser } = useStore();
  const [suggestions, setSuggestions] = useState<Record<string, AISuggestion>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [resolvedMap, setResolvedMap] = useState<Record<string, boolean>>({});

  const handleRequestAISuggestion = async (exc: any) => {
    setLoadingMap(prev => ({ ...prev, [exc.id]: true }));
    const order = orders.find(o => o.id === exc.orderId);

    const res = await api.post<AISuggestion>('/admin/ai/suggest-exception-resolution', {
      exception_id: exc.id,
      order_id: exc.orderId,
      exception_type: exc.type,
      reason: exc.reason,
      description: exc.description,
      pincode: order?.address.pincode || '560034'
    });

    setLoadingMap(prev => ({ ...prev, [exc.id]: false }));
    if (res.data) {
      setSuggestions(prev => ({ ...prev, [exc.id]: res.data! }));
    }
  };

  const handleApproveResolution = (excId: string, orderId: string, depotId: string, reasoning: string) => {
    reassignOrderDepot(orderId, depotId, `AI Suggested Resolution: ${reasoning}`, currentUser?.id || 'admin-1');
    setResolvedMap(prev => ({ ...prev, [excId]: true }));
  };

  const activeExceptions = exceptions.filter(e => e.status === 'Open' && !resolvedMap[e.id]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <span>Delivery & Depot Exceptions Queue</span>
            <span className="ml-3 bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center border border-purple-200">
              <Bot size={14} className="mr-1 text-purple-600" /> AI-Assisted Dispatch
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Monitor and resolve unassigned depot orders, service boundaries, and delivery failures with Human-in-the-Loop AI recommendations.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between bg-slate-50/50">
          <span>Active Open Exceptions ({activeExceptions.length})</span>
        </div>

        <div className="divide-y divide-slate-100">
          {activeExceptions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle size={44} className="mx-auto mb-3 text-emerald-500" />
              <h3 className="font-bold text-slate-700 text-base mb-1">Queue Fully Resolved</h3>
              <p className="text-xs text-slate-500">No active exceptions. All depot assignments and deliveries are operating within threshold parameters.</p>
            </div>
          ) : (
            activeExceptions.map(exc => {
              const order = orders.find(o => o.id === exc.orderId);
              const aiSug = suggestions[exc.id];
              const isLoading = loadingMap[exc.id];

              return (
                <div key={exc.id} className="p-5 hover:bg-slate-50/60 transition-colors space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-red-200">
                          {exc.type}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-700">{exc.id}</span>
                        <span className="text-xs text-slate-400">• Order: {exc.orderId}</span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base">{exc.reason}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{exc.description}</p>
                      
                      {order && (
                        <div className="text-xs text-slate-600 bg-slate-100/80 p-2.5 rounded-lg border border-slate-200/60 inline-block mt-1">
                          <strong>Customer Address:</strong> {order.address.houseOrFlat}, {order.address.street} (Pincode: <strong className="text-slate-800">{order.address.pincode}</strong>)
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <span className="text-xs text-slate-400">{new Date(exc.createdAt).toLocaleTimeString()}</span>
                      
                      {!aiSug && (
                        <button
                          onClick={() => handleRequestAISuggestion(exc)}
                          disabled={isLoading}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow flex items-center space-x-1.5 transition-all disabled:opacity-50"
                        >
                          <Sparkles size={15} />
                          <span>{isLoading ? 'Analyzing Resolution...' : '✨ AI Suggest Resolution'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI Recommendation Card */}
                  {aiSug && (
                    <div className="bg-gradient-to-br from-purple-50 via-slate-50 to-indigo-50 border border-purple-200/80 rounded-2xl p-4 space-y-3 shadow-sm animate-in fade-in duration-200">
                      <div className="flex justify-between items-center border-b border-purple-100 pb-2.5">
                        <div className="flex items-center space-x-2 text-purple-900 font-bold text-xs">
                          <Bot className="text-purple-600" size={18} />
                          <span>AI Dispatch Assistant Recommendation</span>
                        </div>
                        <span className="bg-purple-200/80 text-purple-900 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full border border-purple-300/50">
                          {(aiSug.confidence_score * 100).toFixed(0)}% Confidence
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <p className="text-slate-800 font-medium">{aiSug.summary}</p>
                        <p className="text-slate-600 bg-white/80 p-2.5 rounded-lg border border-purple-100 text-[11px] leading-relaxed">
                          <strong>Justification:</strong> {aiSug.reasoning}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-purple-100 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-xs text-purple-900 font-bold">
                          <ShieldCheck size={16} className="text-purple-600" />
                          <span>Action: {aiSug.suggested_action}</span>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSuggestions(prev => {
                              const copy = { ...prev };
                              delete copy[exc.id];
                              return copy;
                            })}
                            className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-bold bg-white rounded-lg border border-slate-200 hover:bg-slate-100"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleApproveResolution(exc.id, exc.orderId, aiSug.recommended_depot_id, aiSug.reasoning)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-sm flex items-center space-x-1 transition-colors"
                          >
                            <span>Approve & Execute</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminExceptions;

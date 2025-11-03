type Callback = (payload?: any) => void;
const events: Record<string, Callback[]> = {};
export function on(event: string, cb: Callback) {
  events[event] = events[event] || [];
  events[event].push(cb);
  return () => { events[event] = events[event].filter(f => f !== cb); };
}
export function emit(event: string, payload?: any) {
  (events[event] || []).forEach(cb => cb(payload));
}

export default { on, emit };

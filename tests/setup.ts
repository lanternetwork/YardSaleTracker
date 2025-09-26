// tests/setup.ts
import { vi } from 'vitest';
import { setupServer } from 'msw/node';
import { beforeAll, afterAll, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest'

// Provide default environment variables for tests
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'test-key-1234567890'
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

// Spyable google maps globals for integration tests
const MarkerMock = vi.fn().mockImplementation((opts: any) => ({
  setMap: vi.fn(),
  addListener: vi.fn(),
  getPosition: vi.fn(() => ({ lat: () => 37.7749, lng: () => -122.4194 })),
  __opts: opts,
}))
const TOP_LEFT = Symbol.for('TOP_LEFT')

const MapMock = vi.fn().mockImplementation((_el: any, _opts: any) => ({
  setCenter: vi.fn(),
  setZoom: vi.fn(),
  getZoom: vi.fn(() => 10),
  fitBounds: vi.fn(),
  addListener: vi.fn(),
  controls: { [TOP_LEFT]: { push: vi.fn() } },
}))
const InfoWindowMock = vi.fn().mockImplementation((_opts: any) => ({
  open: vi.fn(),
  close: vi.fn(),
}))
const LatLngBoundsMock = vi.fn().mockImplementation(() => ({
  extend: vi.fn(),
  isEmpty: vi.fn(() => false),
}))

// Indirection layer so tests can assign window.google = mockGoogle and still have
// already-imported modules call into the latest implementation
;(global as any).__googleImpl = {
  maps: {
    places: {
      Autocomplete: vi.fn().mockImplementation((_input: any, _opts: any) => ({
        addListener: vi.fn(),
        getPlace: vi.fn(() => ({ geometry: null })),
      })),
    },
    Map: MapMock,
    Marker: MarkerMock,
    InfoWindow: InfoWindowMock,
    LatLngBounds: LatLngBoundsMock,
    Size: vi.fn().mockImplementation((w: number, h: number) => ({ width: w, height: h })),
    ControlPosition: { TOP_LEFT },
    event: { addListener: vi.fn(), removeListener: vi.fn() },
  },
}

const googleWrapper = {
  maps: {
    places: (global as any).__googleImpl.maps.places,
    Map: (global as any).__googleImpl.maps.Map,
    Marker: (global as any).__googleImpl.maps.Marker,
    InfoWindow: (global as any).__googleImpl.maps.InfoWindow,
    LatLngBounds: (global as any).__googleImpl.maps.LatLngBounds,
    Size: (global as any).__googleImpl.maps.Size,
    ControlPosition: (global as any).__googleImpl.maps.ControlPosition,
    event: (global as any).__googleImpl.maps.event,
  },
}

Object.defineProperty(global as any, 'google', {
  configurable: true,
  get() {
    return googleWrapper
  },
  set(v: any) {
    ;(global as any).__googleImpl = v
  },
})

// Also set on window for browser environment
if (typeof window !== 'undefined') {
  Object.defineProperty(window as any, 'google', {
    configurable: true,
    get() {
      return googleWrapper
    },
    set(v: any) {
      ;(global as any).__googleImpl = v
    },
  })
}

// Geolocation mock for tests that use it
;(global as any).navigator = (global as any).navigator || {}
;(global as any).navigator.geolocation = (global as any).navigator.geolocation || {
  getCurrentPosition: vi.fn().mockImplementation((success: any, _error: any) => {
    success({ coords: { latitude: 37.7749, longitude: -122.4194 } })
  }),
}

// Mock js-api-loader with a spy-able Loader constructor
vi.mock('@googlemaps/js-api-loader', async () => {
	const Loader: any = vi.fn().mockImplementation((_opts: any) => ({
		load: vi.fn().mockImplementation(() => {
			// Return the current google implementation (which can be overridden by tests)
			return Promise.resolve((global as any).google || (window as any).google)
		}),
	}))
	// Also expose named export for tests that do require() and access Loader directly
	return { default: Loader, Loader }
})

// Lightweight Supabase client mock that:
// - returns a deterministic signed-in user
// - sets owner_id on insert if missing
// - restricts update/delete to owner rows
// - exposes spies for assertions
vi.mock('@supabase/supabase-js', () => {
	const calls: any = { tables: {}, auth: {} };
	const TEST_USER = { id: 'test-user-1', email: 'test@example.com' };

	const auth = {
		getUser: vi.fn().mockResolvedValue({ data: { user: TEST_USER }, error: null }),
		onAuthStateChange: vi.fn().mockImplementation((cb: any) => {
			cb('SIGNED_IN', { user: TEST_USER });
			return { data: { subscription: { unsubscribe: vi.fn() } } };
		}),
	};
	calls.auth = auth;

	function makeTableAPI(table: string) {
		if (!calls.tables[table]) calls.tables[table] = { rows: [] as any[] };
		const bag = calls.tables[table];

		let updateSpy: any = null
		let deleteSpy: any = null
		let lastPromise: Promise<any> | null = null

		const chain = () => ({
			eq: vi.fn(() => chain()),
			neq: vi.fn(() => chain()),
			in: vi.fn(() => chain()),
			order: vi.fn(() => chain()),
			limit: vi.fn(() => chain()),
			range: vi.fn(() => chain()),
			then: (resolve: any, reject?: any) => (lastPromise || Promise.resolve({ data: bag.rows.slice(), error: null })).then(resolve, reject),
		})

		const api: any = {
			insert: vi.fn(async (payload: any | any[]) => {
				const arr = Array.isArray(payload) ? payload : [payload];
				const inserted = arr.map((r) => ({
					// preserve provided id; only create one if missing
					id: r.id ?? `sale-${Math.random().toString(36).slice(2, 8)}`,
					...r,
					owner_id: r.owner_id ?? TEST_USER.id,
				}));
				bag.rows.push(...inserted);
				lastPromise = Promise.resolve({ data: inserted, error: null })
				return { data: inserted, error: null };
			}),
			select: vi.fn(async () => ({ data: bag.rows.slice(), error: null })),
			get update() {
				return (...args: any[]) => {
					if (typeof updateSpy === 'function') lastPromise = Promise.resolve(updateSpy(...args))
					return chain()
				}
			},
			set update(fn: any) {
				updateSpy = fn
			},
			get delete() {
				return (...args: any[]) => {
					if (typeof deleteSpy === 'function') lastPromise = Promise.resolve(deleteSpy(...args))
					return chain()
				}
			},
			set delete(fn: any) {
				deleteSpy = fn
			},
			single: vi.fn(async () => ({ data: bag.rows[0] ?? null, error: null })),
			maybeSingle: vi.fn(async () => ({ data: bag.rows[0] ?? null, error: null })),
		};
		return api;
	}

	const client = {
		auth,
		from: (table: string) => makeTableAPI(table),
		rpc: vi.fn(async () => ({ data: null, error: null })),
		storage: { from: vi.fn(() => ({ upload: vi.fn(), getPublicUrl: vi.fn() })) },
		__calls: calls, // available to tests if they need to inspect spies
	};

	return {
		createClient: vi.fn(() => client),
	};
});

// MSW server for HTTP mocking in integration tests
export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

export {};

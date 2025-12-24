import { computed, onMounted, onUnmounted, ref } from 'vue';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface BreakpointConfig {
	xs: number; // 0-599px
	sm: number; // 600-959px
	md: number; // 960-1279px
	lg: number; // 1280-1919px
	xl: number; // 1920-2559px
	xxl: number; // 2560px+
}

const DEFAULT_BREAKPOINTS: BreakpointConfig = {
	xs: 0,
	sm: 600,
	md: 960,
	lg: 1280,
	xl: 1920,
	xxl: 2560,
};

/**
 * Composable для отслеживания текущего breakpoint
 * Использует ResizeObserver для реактивности
 */
export function useBreakpoint(config: BreakpointConfig = DEFAULT_BREAKPOINTS) {
	const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1920);

	const currentBreakpoint = computed<Breakpoint>(() => {
		const w = windowWidth.value;
		if (w >= config.xxl) return 'xxl';
		if (w >= config.xl) return 'xl';
		if (w >= config.lg) return 'lg';
		if (w >= config.md) return 'md';
		if (w >= config.sm) return 'sm';
		return 'xs';
	});

	const isXs = computed(() => currentBreakpoint.value === 'xs');
	const isSm = computed(() => currentBreakpoint.value === 'sm');
	const isMd = computed(() => currentBreakpoint.value === 'md');
	const isLg = computed(() => currentBreakpoint.value === 'lg');
	const isXl = computed(() => currentBreakpoint.value === 'xl');
	const isXxl = computed(() => currentBreakpoint.value === 'xxl');

	const smAndDown = computed(() => ['xs', 'sm'].includes(currentBreakpoint.value));
	const mdAndDown = computed(() => ['xs', 'sm', 'md'].includes(currentBreakpoint.value));
	const lgAndUp = computed(() => ['lg', 'xl', 'xxl'].includes(currentBreakpoint.value));
	const xlAndUp = computed(() => ['xl', 'xxl'].includes(currentBreakpoint.value));

	let resizeObserver: ResizeObserver | null = null;

	const handleResize = () => {
		windowWidth.value = window.innerWidth;
	};

	onMounted(() => {
		if (typeof window === 'undefined') return;

		if (typeof ResizeObserver !== 'undefined') {
			resizeObserver = new ResizeObserver(handleResize);
			resizeObserver.observe(document.documentElement);
		} else {
			window.addEventListener('resize', handleResize);
		}

		handleResize();
	});

	onUnmounted(() => {
		if (resizeObserver) {
			resizeObserver.disconnect();
		} else if (typeof window !== 'undefined') {
			window.removeEventListener('resize', handleResize);
		}
	});

	return {
		currentBreakpoint,
		windowWidth,
		isXs,
		isSm,
		isMd,
		isLg,
		isXl,
		isXxl,
		smAndDown,
		mdAndDown,
		lgAndUp,
		xlAndUp,
	};
}

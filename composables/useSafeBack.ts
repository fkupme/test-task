// Карта иерархии разделов
const hierarchyMap: Record<string, string> = {
  // Настройки -> Параметры
  '/settings/parameters/advertisement': '/settings/parameters',
  '/settings/parameters/agreement': '/settings/parameters',
  '/settings/parameters/faq': '/settings/parameters',
  '/settings/parameters/links': '/settings/parameters',
  '/settings/parameters/orders': '/settings/parameters',
  '/settings/parameters/scores': '/settings/parameters',
  '/settings/parameters/service': '/settings/parameters',
  
  // Настройки -> Основное
  '/settings/main/cities': '/settings/main',
  '/settings/main/cost-items-type': '/settings/main',
  '/settings/main/feature-type': '/settings/main',
  '/settings/main/options': '/settings/main',
  '/settings/main/position-groups': '/settings/main',
  '/settings/main/sources': '/settings/main',
  '/settings/main/spheres': '/settings/main',
  
  // Настройки -> Шаблоны уведомлений
  '/settings/notifications-templates/create': '/settings/notifications-templates',
  
  // Настройки -> верхний уровень
  '/settings/calendar-production': '/settings',
  '/settings/client-references': '/settings',
  '/settings/notifications-templates': '/settings',
  '/settings/paychannel': '/settings',
  '/settings/tariffs': '/settings',
  '/settings/tariffs_2': '/settings',
  '/settings/parameters': '/settings',
  '/settings/main': '/settings',
  
  // Управление
  '/management/clients': '/management',
  '/management/mailing': '/management',
  '/management/partners': '/management',
  '/management/review-edit': '/management',
  '/management/staff-access': '/management',
  
  // Разделы в главную
  '/settings': '/',
  '/management': '/',
  '/orders': '/',
  '/reports': '/',
  '/expenses': '/',
  '/content': '/',
  '/partner-profile': '/',
}

function getHierarchicalParent(path: string): string | null {
  const clean = path.split("?")[0].split("#")[0];
  
  // Проверяем точное совпадение в карте иерархии
  if (hierarchyMap[clean]) {
    return hierarchyMap[clean];
  }
  
  // Проверяем вложенные пути (например /settings/parameters/agreement -> /settings/parameters -> /settings)
  for (const pattern of Object.keys(hierarchyMap)) {
    if (clean.startsWith(pattern + '/')) {
      return pattern;
    }
  }
  
  // Fallback: убираем последний сегмент пути
  const segments = clean.split("/").filter(Boolean);
  if (segments.length <= 1) return '/';
  return "/" + segments.slice(0, -1).join("/");
}

export function useSafeBack() {
  const router = useRouter();
  const route = useRoute();

  async function goBack(fallback?: string) {
    // Используем только иерархическую навигацию
    const hierarchicalParent = getHierarchicalParent(route.fullPath);
    if (hierarchicalParent && hierarchicalParent !== route.fullPath) {
      return router.push(hierarchicalParent);
    }

    // Fallback из meta или параметра
    const metaFallback = (route.meta?.backTo as string | undefined) || fallback || "/";
    return router.push(metaFallback);
  }

  return { goBack };
} 
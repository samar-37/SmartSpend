export function initThemeColors() {
  const colors = [
    ['#4f46e5', '#06b6d4'],
    ['#10b981', '#3b82f6'],
    ['#f59e0b', '#ef4444'],
    ['#8b5cf6', '#ec4899']
  ];
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.bottom = '12px';
  wrapper.style.right = '12px';
  wrapper.style.display = 'flex';
  wrapper.style.gap = '8px';
  wrapper.style.zIndex = '1000';

  colors.forEach(([a, b]) => {
    const btn = document.createElement('button');
    btn.style.width = '24px';
    btn.style.height = '24px';
    btn.style.border = 'none';
    btn.style.borderRadius = '50%';
    btn.style.background = `linear-gradient(135deg, ${a}, ${b})`;
    btn.style.cursor = 'pointer';
    btn.onclick = () => {
      document.documentElement.style.setProperty('--accent', a);
      document.documentElement.style.setProperty('--accent-2', b);
      localStorage.setItem('theme-colors', JSON.stringify([a, b]));
    };
    wrapper.appendChild(btn);
  });
  document.body.appendChild(wrapper);

  const saved = localStorage.getItem('theme-colors');
  if (saved) {
    const [a, b] = JSON.parse(saved);
    document.documentElement.style.setProperty('--accent', a);
    document.documentElement.style.setProperty('--accent-2', b);
  }
}

initThemeColors();
export function moAnhTrongTabMoi(event, source, title = 'Ảnh chứng từ chuyển khoản') {
  if (!source) return;

  const preview = window.open('', '_blank');
  if (!preview) return;

  event?.preventDefault();
  preview.opener = null;

  const { document } = preview;
  document.title = title;
  document.documentElement.style.background = '#f8fafc';
  document.body.style.margin = '0';
  document.body.style.minHeight = '100vh';
  document.body.style.display = 'flex';
  document.body.style.alignItems = 'center';
  document.body.style.justifyContent = 'center';
  document.body.style.padding = '24px';
  document.body.style.boxSizing = 'border-box';
  document.body.style.background = '#f8fafc';

  const loading = document.createElement('p');
  loading.textContent = 'Đang tải ảnh chứng từ...';
  loading.style.color = '#64748b';
  loading.style.fontFamily = 'system-ui, sans-serif';

  const image = document.createElement('img');
  image.alt = title;
  image.style.display = 'none';
  image.style.maxWidth = '100%';
  image.style.maxHeight = 'calc(100vh - 48px)';
  image.style.objectFit = 'contain';
  image.style.borderRadius = '12px';
  image.style.background = '#fff';
  image.style.boxShadow = '0 10px 30px rgba(15, 23, 42, 0.15)';
  image.onload = () => {
    loading.remove();
    image.style.display = 'block';
  };
  image.onerror = () => {
    loading.textContent = 'Không thể tải ảnh chứng từ. Vui lòng thử lại.';
    loading.style.color = '#b91c1c';
  };
  image.src = source;

  document.body.append(loading, image);
}

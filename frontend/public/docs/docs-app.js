const storedTheme = localStorage.getItem('token-life-docs-theme')
const preferredTheme =
  storedTheme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
document.body.dataset.theme = preferredTheme

const storedLang = localStorage.getItem('token-life-docs-lang')
const browserLang = navigator.language || ''
const hashPath = window.location.hash.replace(/^#/, '')
const isRootEntry = !hashPath || hashPath === '/' || hashPath === '/README'

if (!storedLang && isRootEntry && !browserLang.toLowerCase().startsWith('zh')) {
  window.location.replace('/docs/index.html#/en/')
} else if (storedLang === 'en' && isRootEntry) {
  window.location.replace('/docs/index.html#/en/')
}

function syncDocsThemeIcon() {
  const icon = document.querySelector('.theme-icon')
  if (icon) {
    icon.textContent = document.body.dataset.theme === 'dark' ? '☾' : '☀'
  }
}

document.addEventListener(
  'click',
  function (event) {
    const themeToggle = event.target.closest('.theme-toggle')
    if (themeToggle) {
      event.preventDefault()
      const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark'
      document.body.dataset.theme = nextTheme
      localStorage.setItem('token-life-docs-theme', nextTheme)
      syncDocsThemeIcon()
      return
    }

    const langLink = event.target.closest('[data-doc-lang]')
    if (langLink) {
      localStorage.setItem('token-life-docs-lang', langLink.dataset.docLang)
    }
  },
  true
)

var $docsify = (window.$docsify = {
  name: 'Token Life Docs',
  repo: '',
  basePath: '/docs/',
  homepage: 'README.md',
  loadSidebar: '_sidebar.md',
  alias: {
    '/en/.*/_sidebar.md': '/en/_sidebar.md',
    '/.*/_sidebar.md': '/_sidebar.md'
  },
  loadNavbar: false,
  subMaxLevel: 3,
  auto2top: true,
  maxLevel: 4,
  search: {
    maxAge: 86400000,
    paths: 'auto',
    placeholder: '搜索文档',
    noData: '没有找到相关内容',
    depth: 4,
    hideOtherSidebarContent: false,
    namespace: 'token-life-docs'
  },
  copyCode: {
    buttonText: '复制',
    errorText: '复制失败',
    successText: '已复制'
  },
  plugins: [
    function (hook) {
      hook.doneEach(function () {
        const currentPath = window.location.hash.replace(/^#/, '')
        const currentLang = currentPath === '/en/' || currentPath.startsWith('/en/') ? 'en' : 'zh'
        document.documentElement.lang = currentLang === 'en' ? 'en' : 'zh-CN'
        document.querySelectorAll('[data-doc-lang]').forEach(function (link) {
          link.classList.toggle('active', link.dataset.docLang === currentLang)
        })
        document.querySelectorAll('[data-i18n-zh]').forEach(function (node) {
          node.textContent = currentLang === 'en' ? node.dataset.i18nEn : node.dataset.i18nZh
        })
        document.querySelectorAll('[data-doc-route]').forEach(function (link) {
          const prefix = currentLang === 'en' ? '/en/' : '/'
          link.setAttribute('href', `#${prefix}${link.dataset.docRoute}`)
        })
        const searchInput = document.querySelector('.search input')
        if (searchInput) {
          searchInput.placeholder = currentLang === 'en' ? 'Search docs' : '搜索文档'
        }
        document.querySelectorAll('a[href^="http"]').forEach(function (link) {
          link.setAttribute('target', '_blank')
          link.setAttribute('rel', 'noreferrer')
        })
      })
    }
  ]
})

syncDocsThemeIcon()

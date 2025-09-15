export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Icon Manager API
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Next.js backend for icon management system
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>API Endpoints:</p>
          <ul className="space-y-1">
            <li>GET /api/categories - 获取分类列表</li>
            <li>GET /api/images - 获取图片列表</li>
            <li>POST /api/upload - 上传图片</li>
            <li>DELETE /api/images/:category/:imageName - 删除图片</li>
            <li>POST /api/categories - 创建分类</li>
            <li>GET /:category/:imageName - 直接访问图片</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
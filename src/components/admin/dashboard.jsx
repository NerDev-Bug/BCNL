import {
  CubeIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

function AdminDashboard() {
  const stats = [
    {
      label: "Total Products",
      value: "128",
      icon: CubeIcon,
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Orders",
      value: "542",
      icon: ShoppingBagIcon,
      color: "green",
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      label: "Total Sales",
      value: "₱86,450",
      icon: CreditCardIcon,
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      label: "Total Revenue",
      value: "₱124,980",
      icon: BanknotesIcon,
      color: "yellow",
      gradient: "from-yellow-500 to-yellow-600",
      bgGradient: "from-yellow-50 to-yellow-100",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">BCNL Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of your business metrics and statistics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group bg-white p-6 rounded-2xl shadow-lg border border-gray-100
                  transition-all duration-300
                  hover:-translate-y-2 hover:shadow-2xl hover:border-[#7B2220]/20
                  relative overflow-hidden"
              >
                {/* Background gradient accent */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.bgGradient} opacity-10 rounded-full blur-2xl -mr-16 -mt-16`} />
                
                <div className="relative flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-500 text-sm font-medium mb-2">{stat.label}</p>
                    <h2 className="text-3xl font-bold text-gray-900">{stat.value}</h2>
                  </div>
                  
                  {/* Icon Container */}
                  <div className={`${stat.iconBg} p-4 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className={`w-8 h-8 ${stat.iconColor}`} />
                  </div>
                </div>

                {/* Bottom accent bar */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              </div>
            );
          })}
        </div>

        {/* Additional Dashboard Sections Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📦</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New order received</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-lg">✅</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Order completed</p>
                  <p className="text-xs text-gray-500">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 text-lg">👤</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New user registered</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          {/* <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 text-left group">
                <div className="text-2xl mb-2">➕</div>
                <p className="text-sm font-semibold text-blue-900">Add Product</p>
              </button>
              <button className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200 hover:border-green-400 hover:shadow-md transition-all duration-200 text-left group">
                <div className="text-2xl mb-2">📊</div>
                <p className="text-sm font-semibold text-green-900">View Reports</p>
              </button>
              <button className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-md transition-all duration-200 text-left group">
                <div className="text-2xl mb-2">👥</div>
                <p className="text-sm font-semibold text-purple-900">Manage Users</p>
              </button>
              <button className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border-2 border-yellow-200 hover:border-yellow-400 hover:shadow-md transition-all duration-200 text-left group">
                <div className="text-2xl mb-2">⚙️</div>
                <p className="text-sm font-semibold text-yellow-900">Settings</p>
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

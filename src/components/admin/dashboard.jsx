import {
  CubeIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">BCNL Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Products */}
        <div className="group bg-white p-6 rounded-xl shadow-sm
          transition-all duration-300
          hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Products</p>
              <h2 className="text-2xl font-bold">128</h2>
            </div>
            <CubeIcon className="w-10 h-10 text-blue-500
              transition-transform duration-300
              group-hover:scale-110" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="group bg-white p-6 rounded-xl shadow-sm
          transition-all duration-300
          hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Orders</p>
              <h2 className="text-2xl font-bold">542</h2>
            </div>
            <ShoppingBagIcon className="w-10 h-10 text-green-500
              transition-transform duration-300
              group-hover:scale-110" />
          </div>
        </div>

        {/* Total Sales */}
        <div className="group bg-white p-6 rounded-xl shadow-sm
          transition-all duration-300
          hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Sales</p>
              <h2 className="text-2xl font-bold">₱86,450</h2>
            </div>
            <CreditCardIcon className="w-10 h-10 text-purple-500
              transition-transform duration-300
              group-hover:scale-110" />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="group bg-white p-6 rounded-xl shadow-sm
          transition-all duration-300
          hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <h2 className="text-2xl font-bold">₱124,980</h2>
            </div>
            <BanknotesIcon className="w-10 h-10 text-yellow-500
              transition-transform duration-300
              group-hover:scale-110" />
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;

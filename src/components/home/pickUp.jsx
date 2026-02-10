function pickUp() {
  return (
    <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-6">Pick-Up Orders</h1>
        <p className="text-center text-gray-600 mb-8">
            Please wait for our staff to confirm your order and provide you with the estimated pick-up time.
        </p>
        <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <ul className="mb-4">
                <li className="flex justify-between mb-2">
                    <span>Chocolate Cake</span>
                    <span>$20.00</span>
                </li>
                <li className="flex justify-between mb-2">
                    <span>Vanilla Cupcakes (6 pcs)</span>
                    <span>$15.00</span>
                </li>
                <li className="flex justify-between mb-2">
                    <span>Red Velvet Cake</span>
                    <span>$25.00</span>
                </li>
            </ul>
            <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>$60.00</span>
            </div>
        </div>
    </div>
  )
}
export default pickUp;
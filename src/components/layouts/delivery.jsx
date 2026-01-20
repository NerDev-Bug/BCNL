function DeliveryLayout() {
  return (
    <div className="w-full p-2 bg-black">
      <div className="flex justify-center items-center text-white">
        <img src="./images/Backword-Arrow.png" alt="" className="w-6 h-4 mr-4" />
        <img src="./images/truck.png" alt="truck" className="w-6 h-4 mr-4" />
        <p className="mr-4 text-sm">Delivery available Wagenigen only</p>
        <img src="./images/Farword-Arrow.png" alt="" className="w-6 h-4" />
      </div>
    </div>
  )
}

export default DeliveryLayout
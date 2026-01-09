function DeliveryLayout() {
  return (
    <div className="fixed top-[60px] left-0 right-0 p-2 bg-black z-40">
      <div className="flex flex-row justify-center items-center text-white">
        <span><img src="./images/Backword-Arrow.png" alt="" className="w-6 h-4 mr-4" /></span>
        <img src="./images/truck.png" alt="truck" className="w-6 h-4 mr-4" />
        <p className="mr-4 text-sm text-white">Delivery available Wageningen only</p>
        <span><img src="./images/Farword-Arrow.png" alt="" className="w-6 h-4" /></span>
      </div>
    </div>
  );
}

export default DeliveryLayout;
function Home() {
  const maisPedidos = [
    { id: 1, name: "X-Burguer", price: 29.9, image: "https://picsum.photos/200/150?random=11" },
    { id: 2, name: "Pizza Calabresa", price: 44.9, image: "https://picsum.photos/200/150?random=12" },
    { id: 3, name: "Sushi 12 peças", price: 49.9, image: "https://picsum.photos/200/150?random=13" },
    { id: 4, name: "Açaí 300ml", price: 14.9, image: "https://picsum.photos/200/150?random=14" }
  ];

  const promocoes = [
    { id: 5, name: "Combo Burguer + Refri", price: 34.9, image: "https://picsum.photos/200/150?random=21" },
    { id: 6, name: "Pizza Família Promo", price: 59.9, image: "https://picsum.photos/200/150?random=22" },
    { id: 7, name: "Hot Dog Duplo", price: 19.9, image: "https://picsum.photos/200/150?random=23" }
  ];

  const lanches = [
    { id: 8, name: "X-Bacon", description: "Carne 180g, bacon crocante e cheddar", price: 32.9, image: "https://picsum.photos/400/300?random=31" },
    { id: 9, name: "X-Salada", description: "Carne, alface, tomate e maionese especial", price: 27.9, image: "https://picsum.photos/400/300?random=32" },
    { id: 10, name: "Wrap Frango", description: "Frango grelhado com molho leve", price: 24.9, image: "https://picsum.photos/400/300?random=33" },
    { id: 11, name: "Batata Frita Grande", description: "Porção generosa crocante", price: 18.9, image: "https://picsum.photos/400/300?random=34" },
    { id: 12, name: "Cheeseburguer Duplo", description: "Duas carnes e muito queijo", price: 36.9, image: "https://picsum.photos/400/300?random=35" },
    { id: 13, name: "Hot Dog Especial", description: "Salsicha premium e purê", price: 21.9, image: "https://picsum.photos/400/300?random=36" }
  ];

  return (
    <div className="min-h-screen bg-white text-black px-6 py-8 space-y-12">

      {/* MAIS PEDIDOS */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-black">
          🔥 Mais Pedidos
        </h2>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {maisPedidos.map((item) => (
            <div
              key={item.id}
              className="min-w-[160px] bg-white rounded-xl shadow-md overflow-hidden border"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-24 object-cover"
              />
              <div className="p-3">
                <p className="text-sm font-semibold text-black">
                  {item.name}
                </p>
                <p className="text-pink-600 font-bold text-sm">
                  R$ {item.price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROMOÇÕES */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-black">
          💸 Promoções
        </h2>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {promocoes.map((item) => (
            <div
              key={item.id}
              className="min-w-[160px] bg-white rounded-xl shadow-md overflow-hidden border-2 border-pink-500"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-24 object-cover"
              />
              <div className="p-3">
                <p className="text-sm font-semibold text-black">
                  {item.name}
                </p>
                <p className="text-pink-600 font-bold text-sm">
                  R$ {item.price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LISTA PRINCIPAL */}
      <section>
        <h2 className="text-xl font-bold mb-6 text-black">
          🍔 Lanches
        </h2>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {lanches.map((food) => (
            <div
              key={food.id}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 border"
            >
              <div className="overflow-hidden">
                <img
                  src={food.image}
                  alt={food.name}
                  className="w-full h-52 object-cover hover:scale-105 transition duration-300"
                />
              </div>

              <div className="p-5">
                <h3 className="text-lg font-bold text-black">
                  {food.name}
                </h3>

                <p className="text-gray-600 text-sm mt-1">
                  {food.description}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-lg font-bold text-pink-600">
                    R$ {food.price.toFixed(2)}
                  </span>

                  <button className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition">
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

export default Home

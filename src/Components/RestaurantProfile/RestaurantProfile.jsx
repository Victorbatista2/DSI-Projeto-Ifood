"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, X, Clock, Minus, Plus, ChevronRight } from "lucide-react"
import { useApp } from "../../contexts/AppContext"
import "./RestaurantProfile.css"

const RestaurantProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, actions } = useApp()

  const [restauranteData, setRestauranteData] = useState(null)
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [termoPesquisa, setTermoPesquisa] = useState("")
  const [showSidebar, setShowSidebar] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productQuantity, setProductQuantity] = useState(1)
  const [showCartSidebar, setShowCartSidebar] = useState(false)

  // Buscar dados do restaurante
  useEffect(() => {
    const fetchRestauranteData = async () => {
      try {
        setLoading(true)

        // Buscar dados do restaurante
        const restauranteResponse = await fetch(`http://localhost:3001/api/restaurantes/${id}`)
        if (restauranteResponse.ok) {
          const restauranteResult = await restauranteResponse.json()
          setRestauranteData(restauranteResult.data)
        }

        // Buscar produtos do restaurante
        const produtosResponse = await fetch(`http://localhost:3001/api/produtos/restaurante/${id}`)
        if (produtosResponse.ok) {
          const produtosResult = await produtosResponse.json()
          setProdutos(Array.isArray(produtosResult.data) ? produtosResult.data : [])
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchRestauranteData()
    }
  }, [id])

  // Filtrar produtos baseado na pesquisa
  const produtosFiltrados = produtos.filter(
    (produto) =>
      produto.nome?.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
      produto.descricao?.toLowerCase().includes(termoPesquisa.toLowerCase()),
  )

  // Agrupar produtos por categoria
  const produtosPorCategoria = produtosFiltrados.reduce((acc, produto) => {
    const categoria = produto.categoria_nome || "Destaques"
    if (!acc[categoria]) {
      acc[categoria] = []
    }
    acc[categoria].push(produto)
    return acc
  }, {})

  // Abrir modal do produto
  const abrirModalProduto = (produto) => {
    setSelectedProduct(produto)
    setProductQuantity(1)
  }

  // Fechar modal do produto
  const fecharModalProduto = () => {
    setSelectedProduct(null)
    setProductQuantity(1)
  }

  // Adicionar produto ao carrinho
  const adicionarAoCarrinho = () => {
    if (selectedProduct) {
      const produto = {
        id: `${selectedProduct.id_produto || selectedProduct.id}-${Date.now()}`, // ID único
        name: selectedProduct.nome,
        price: formatarPreco(selectedProduct.preco), // Passar como string formatada
        image: selectedProduct.imagem || selectedProduct.imagem_url || "/placeholder.svg?height=150&width=250",
        restaurantId: id,
        restaurantName: restauranteData?.nome_restaurante,
        quantity: productQuantity,
      }

      // Adicionar cada quantidade individualmente
      for (let i = 0; i < productQuantity; i++) {
        actions.addToCart({
          ...produto,
          id: `${selectedProduct.id_produto || selectedProduct.id}-${Date.now()}-${i}`, // ID único para cada item
        })
      }

      fecharModalProduto()
      setShowCartSidebar(true)
    }
  }

  // Aumentar quantidade
  const aumentarQuantidade = () => {
    setProductQuantity((prev) => prev + 1)
  }

  // Diminuir quantidade
  const diminuirQuantidade = () => {
    if (productQuantity > 1) {
      setProductQuantity((prev) => prev - 1)
    }
  }

  const formatarPreco = (preco) => {
    return `R$ ${Number.parseFloat(preco).toFixed(2).replace(".", ",")}`
  }

  const calcularPrecoTotal = () => {
    if (selectedProduct) {
      const total = Number.parseFloat(selectedProduct.preco) * productQuantity
      return formatarPreco(total)
    }
    return "R$ 0,00"
  }

  const voltar = () => {
    navigate(-1)
  }

  const irParaPagamento = () => {
    setShowCartSidebar(false)
    navigate("/pagamento")
  }

  if (loading) {
    return (
      <div className="restaurant-profile-loading">
        <div className="loading-spinner"></div>
        <p>Carregando restaurante...</p>
      </div>
    )
  }

  if (!restauranteData) {
    return (
      <div className="restaurant-profile-error">
        <h2>Restaurante não encontrado</h2>
        <button onClick={voltar} className="btn-voltar">
          Voltar
        </button>
      </div>
    )
  }

  const temProdutos = Object.keys(produtosPorCategoria).length > 0

  return (
    <div className="restaurant-profile-container">
      {/* Header com botão voltar */}
      <div className="restaurant-header-simple">
        <div className="header-content">
          <button onClick={voltar} className="btn-back-simple">
            <ArrowLeft size={24} />
          </button>
        </div>
      </div>

      {/* Informações do Restaurante */}
      <div className="restaurant-info-section">
        <div className="info-content">
          <div className="restaurant-logo-large">
            {restauranteData.imagem ? (
              <img
                src={restauranteData.imagem || "/placeholder.svg"}
                alt={restauranteData.nome_restaurante}
                className="logo-img-large"
              />
            ) : (
              <div className="logo-placeholder-large">
                <span>{restauranteData.nome_restaurante?.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="restaurant-details-large">
            <h1 className="restaurant-name-large">{restauranteData.nome_restaurante}</h1>
            <div className="restaurant-meta">
              <div className="restaurant-rating-large">⭐ {restauranteData.avaliacao_media || "Novo"}</div>
              <div className="restaurant-delivery-info">
                <Clock size={16} />
                <span>30-45 min</span>
              </div>
            </div>
          </div>
          <div className="restaurant-actions">
            <button className="btn-ver-mais-large" onClick={() => setShowSidebar(true)}>
              Ver mais
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="search-section">
        <div className="search-content">
          <div className="search-bar-large">
            <img src="https://img.icons8.com/sf-black/64/search.png" alt="search" className="search-icon-large" />
            <input
              type="text"
              placeholder="Buscar no cardápio"
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
              className="search-input-large"
            />
          </div>
        </div>
      </div>

      {/* Conteúdo Principal - Produtos ou Mensagem */}
      <div className="main-content">
        {temProdutos ? (
          // Se tem produtos, mostra as categorias
          Object.entries(produtosPorCategoria).map(([categoria, produtosCategoria]) => (
            <div key={categoria} className="menu-section-large">
              <h2 className="section-title-large">{categoria}</h2>
              <div className="produtos-grid-large">
                {produtosCategoria.map((produto) => (
                  <div
                    key={produto.id_produto || produto.id}
                    className="produto-card-large"
                    onClick={() => abrirModalProduto(produto)}
                  >
                    <div className="produto-info-large">
                      <h3 className="produto-nome-large">{produto.nome}</h3>
                      <p className="produto-descricao-large">{produto.descricao}</p>
                      <div className="produto-preco-large">{formatarPreco(produto.preco)}</div>
                    </div>
                    <div className="produto-imagem-section">
                      <img
                        src={produto.imagem || produto.imagem_url || "/placeholder.svg?height=150&width=150"}
                        alt={produto.nome}
                        className="produto-imagem-large"
                        onError={(e) => {
                          e.target.src = "/placeholder.svg?height=150&width=150"
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          // Se não tem produtos, mostra a mensagem dentro da mesma estrutura de seção
          <div className="menu-section-large">
            <h2 className="section-title-large">Destaques</h2>
            <div className="empty-state">
              <h3>Nenhum produto disponível</h3>
              <p>Este restaurante ainda não possui produtos cadastrados.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal do Produto */}
      {selectedProduct && (
        <>
          <div className="product-modal-overlay" onClick={fecharModalProduto} />
          <div className="product-modal">
            <div className="product-modal-header">
              <button className="btn-close-modal" onClick={fecharModalProduto}>
                <X size={24} />
              </button>
              <h2 className="product-modal-title">{selectedProduct.nome.toUpperCase()}</h2>
            </div>

            <div className="product-modal-content">
              <div className="product-modal-image">
                <img
                  src={selectedProduct.imagem || selectedProduct.imagem_url || "/placeholder.svg?height=400&width=400"}
                  alt={selectedProduct.nome}
                  className="modal-product-image"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=400&width=400"
                  }}
                />
              </div>

              <div className="product-modal-details">
                <p className="product-modal-description">{selectedProduct.descricao}</p>

                <div className="product-modal-price">
                  <span className="current-price">{formatarPreco(selectedProduct.preco)}</span>
                </div>

                <div className="product-modal-restaurant">
                  <span className="restaurant-name">🏪 {restauranteData.nome_restaurante}</span>
                  <span className="restaurant-rating">⭐ {restauranteData.avaliacao_media || "Novo"}</span>
                </div>

                <div className="product-modal-delivery">
                  <Clock size={16} />
                  <span>30-45 min • Grátis</span>
                </div>

                <div className="product-modal-actions">
                  <div className="quantity-selector">
                    <button className="quantity-btn" onClick={diminuirQuantidade} disabled={productQuantity <= 1}>
                      <Minus size={16} />
                    </button>
                    <span className="quantity-display">{productQuantity}</span>
                    <button className="quantity-btn" onClick={aumentarQuantidade}>
                      <Plus size={16} />
                    </button>
                  </div>

                  <button className="btn-add-to-cart" onClick={adicionarAoCarrinho}>
                    Adicionar {calcularPrecoTotal()}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cart Sidebar */}
      {showCartSidebar && (
        <>
          <div className="cart-sidebar-overlay" onClick={() => setShowCartSidebar(false)} />
          <div className="cart-sidebar">
            <div className="cart-sidebar-header">
              <button className="btn-close-cart-sidebar" onClick={() => setShowCartSidebar(false)}>
                <X size={24} />
              </button>
              <div className="cart-header-info">
                <div className="cart-address">
                  <span>
                    {state.selectedAddress
                      ? `${state.selectedAddress.street}, ${state.selectedAddress.number}`
                      : "Endereço não selecionado"}
                  </span>
                </div>
                <div className="cart-total-badge">
                  <span>
                    R$ {state.cart.total.toFixed(2).replace(".", ",")} {state.cart.items.length}{" "}
                    {state.cart.items.length === 1 ? "item" : "itens"}
                  </span>
                </div>
              </div>
            </div>

            <div className="cart-sidebar-content">
              <div className="cart-order-info">
                <h3>Seu pedido em</h3>
                <div className="cart-restaurant-info">
                  <h2>{restauranteData.nome_restaurante}</h2>
                  <button className="btn-ver-cardapio">Ver Cardápio</button>
                </div>
              </div>

              <div className="cart-suggestions">
                <h3>Sugestões do Chef</h3>
              </div>

              <div className="cart-items">
                {state.cart.items.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-header">
                        <span className="cart-item-quantity">{item.quantity}x</span>
                        <span className="cart-item-name">{item.name}</span>
                        <span className="cart-item-price">{formatarPreco(item.price * item.quantity)}</span>
                      </div>
                      <div className="cart-item-details">
                        <span>1x Bem passado, 1x Enviar ketchup e mostarda sachê</span>
                      </div>
                      <div className="cart-item-badge">
                        <span>🏷️ Item promocional</span>
                      </div>
                      <div className="cart-item-actions">
                        <button className="btn-edit-item">Editar</button>
                        <button className="btn-remove-item" onClick={() => actions.removeFromCart(item.id)}>
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-coupon">
                <div className="coupon-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M21 5H3C2.4 5 2 5.4 2 6V10C2 10.6 2.4 11 3 11H21C21.6 11 22 10.6 22 10V6C22 5.4 21.6 5 21 5Z"
                      stroke="#717171"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21 13H3C2.4 13 2 13.4 2 14V18C2 18.6 2.4 19 3 19H21C21.6 19 22 18.6 22 18V14C22 13.4 21.6 13 21 13Z"
                      stroke="#717171"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="coupon-info">
                  <h4>Cupom</h4>
                  <p>2 cupons disponíveis</p>
                </div>
                <ChevronRight size={20} className="coupon-arrow" />
              </div>

              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>R$ {state.cart.total.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="summary-row">
                  <span>Taxa de entrega</span>
                  <span className="free-delivery">Grátis</span>
                </div>
              </div>

              <div className="cart-total">
                <div className="total-row">
                  <span>Total</span>
                  <span>R$ {state.cart.total.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>

              <button className="btn-choose-payment" onClick={irParaPagamento}>
                Escolher forma de pagamento
              </button>
            </div>
          </div>
        </>
      )}

      {/* Sidebar - Sobre o Restaurante */}
      {showSidebar && (
        <>
          <div className="sidebar-overlay" onClick={() => setShowSidebar(false)} />
          <div className="sidebar">
            <div className="sidebar-header">
              <h2>Sobre</h2>
              <button className="btn-close-sidebar" onClick={() => setShowSidebar(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="sidebar-content">
              {restauranteData.historia && (
                <div className="sidebar-section">
                  <h3>História</h3>
                  <p>{restauranteData.historia}</p>
                </div>
              )}

              <div className="sidebar-section">
                <h3>Endereço</h3>
                <p>
                  {restauranteData.rua || restauranteData.endereco}, {restauranteData.numero}
                  <br />
                  {restauranteData.bairro} - {restauranteData.cidade}/{restauranteData.estado}
                  <br />
                  CEP: {restauranteData.cep}
                </p>
              </div>

              <div className="sidebar-section">
                <h3>Outras informações</h3>
                <p>CNPJ: {restauranteData.cnpj}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default RestaurantProfile





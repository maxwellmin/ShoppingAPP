const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = () => {
    // define your method to get cart data
    return fetch(`${URL}/cart`).then((res) => res.json());
  };

  const getInventory = () => {
    // define your method to get inventory data
    return fetch(`${URL}/inventory`).then((res) => res.json());
  };

  const addToCart = (inventoryItem) => {
    // define your method to add an item to cart
    return fetch(`${URL}/cart`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(inventoryItem)
    }).then(res => res.json());
  };

  const updateCart = (id, newAmount) => {
    // define your method to update an item in cart
    return fetch(`${URL}/cart/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ quantity: newAmount })
    }).then(res => res.json());
  };

  const deleteFromCart = (id) => {
    // define your method to delete an item in cart
    return fetch(`${URL}/cart/${id}`, { method: 'DELETE' })
           .then(res => res.json());
  };

  const checkout = () => {
    return fetch(`${URL}/cart`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to clear the cart');
        }
        return response.json();  
    });
};


  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();



const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory = [];
    #cart = [];
    
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }

    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }

    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }

  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  } = API;

  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();





const View = (() => {
  // implement your logic for View
  const inventoryElement = document.getElementById('inventory-items');
  const cartElement = document.getElementById('cart-items');
  const checkoutButton = document.querySelector('.checkout-btn');

  const renderInventory = (inventory) => {
    inventoryElement.innerHTML = inventory.map(item => `
      <div class="item">
        <span>${item.content}</span>
        <button onclick="Controller.handleUpdateAmount(${item.id}, -1)">-</button>
        <span id="quantity-${item.id}">${item.quantity || 0}</span>
        <button onclick="Controller.handleUpdateAmount(${item.id}, 1)">+</button>
        <button onclick="Controller.handleAddToCart(${item.id})">add to cart</button>
      </div>
    `).join('');
  };

  const renderCart = (cart) => {
    cartElement.innerHTML = cart.map(item => `
      <li>
        ${item.content} - ${item.quantity}
        <button onclick="Controller.handleDelete(${item.id})">delete</button>
      </li>
    `).join('');
  };

  // Ensure that the event listener is attached to the checkout button
  checkoutButton.addEventListener('click', event => {
    // Check if the clicked element has the 'checkout-btn' class
    if (event.target.classList.contains('checkout-btn')) {
      // If it does, call handleCheckout
      Controller.handleCheckout();
    }
  });

  return {
    renderInventory,
    renderCart
  };
})();





const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const init = () => {
    Promise.all([model.getInventory(), model.getCart()]).then(([inventory, cart]) => {
      state.inventory = inventory;
      state.cart = cart;
      view.renderInventory(state.inventory);
      view.renderCart(state.cart);
    });
  };


  const handleUpdateAmount = (id, change) => {

    const item = state.inventory.find(item => item.id === id);
    if (item) {
        item.quantity = Math.max(0, (item.quantity || 0) + change); // no below 0

        const quantityElement = document.getElementById(`quantity-${id}`);
        if (quantityElement) {
            quantityElement.textContent = item.quantity;
        }
    }
  
  
  };

  // const handleAddToCart = (item) => {
    
  // };

  const handleAddToCart = (itemId) => {
    // Implement logic to add items to the cart
    const inventoryItem = state.inventory.find(item => item.id === itemId);
    if (inventoryItem && inventoryItem.quantity > 0) {
      let cartItem = state.cart.find(item => item.id === itemId);
      if (cartItem) {     // Item already in cart
        cartItem.quantity += inventoryItem.quantity;
      } else {      // Add new item
        cartItem = {
          id: inventoryItem.id,
          content: inventoryItem.content, 
          quantity: inventoryItem.quantity
        };
        state.cart.push(cartItem);
      }
      
      inventoryItem.quantity = 0;
  
      // Update the view to reflect these changes
      view.renderInventory(state.inventory);
      view.renderCart(state.cart);
      model.addToCart(cartItem);   // Send cartItem to API to update server
    }
  };

  

  const handleDelete = (id) => {
    model.deleteFromCart(id).then(() => {
      state.cart = state.cart.filter(item => item.id !== id);
      view.renderCart(state.cart);
    });
  };



  const handleCheckout = () => {
    
    const itemIds = state.cart.map(item => item.id);
    Promise.all(itemIds.map(id => model.deleteFromCart(id)))
    .then(() => {
      state.cart = [];
      view.renderCart(state.cart);
      localStorage.removeItem('cart'); // Clear local storage after checkout
      alert("check out successfully!");
    })
    .catch(error => {
      alert("check out error!");
    });
  };



  const bootstrap = () => {
    init();
    state.subscribe(() => {
      view.renderInventory(state.inventory);
      view.renderCart(state.cart);
    });
  };

  return {
    bootstrap,
    handleUpdateAmount,
    handleAddToCart,
    handleDelete,
    handleCheckout
  };
})(Model, View);

Controller.bootstrap();

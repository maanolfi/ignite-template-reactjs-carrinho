import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const dataCart = [...cart];
      const productExist = dataCart.find(p => p.id === productId)

      const getStock = await api.get(`/stock/${productId}`)
      const stockAmount = getStock.data.amount
      const currentAmount = productExist ? productExist.amount : 0
      const amount = currentAmount + 1

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if(productExist) {
        productExist.amount = amount
      } else {
        const product = await api.get(`/products/${productId}`)

        const newProduct = {
          ...product.data,
          amount: 1
        }

        dataCart.push(newProduct)
      }

      setCart(dataCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(dataCart))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const dataCart = [...cart]
      const prodIndex = dataCart.findIndex(i => i.id === productId)
     
      if(prodIndex >= 0) {
        dataCart.splice(prodIndex, 1)
        setCart(dataCart)
        
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(dataCart))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) {
        return
      }

      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const dataCart = [...cart]
      const prodExists = dataCart.find(p => p.id === productId)

      if(prodExists) {
        prodExists.amount = amount
        setCart(dataCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

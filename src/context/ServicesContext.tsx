import { createContext, useContext, useState, useEffect } from 'react';
import { 
  fetchServices, 
  fetchCategories,
  createService as apiCreateService 
} from '@/api/Services';
import { Service, Category, CreateServiceDto } from '@/api/types';

type ServicesContextType = {
  services: Service[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  createService: (data: CreateServiceDto) => Promise<void>;
  refetchServices: () => Promise<void>;
};

const ServicesContext = createContext<ServicesContextType>({
  services: [],
  categories: [],
  loading: false,
  error: null,
  createService: async () => {},
  refetchServices: async () => {},
});

export const ServicesProvider = ({ children }: { children: React.ReactNode }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        fetchServices(),
        fetchCategories()
      ]);
      setServices(servicesRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (data: CreateServiceDto) => {
    try {
      setLoading(true);
      const response = await apiCreateService(data);
      setServices(prev => [response.data, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create service');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <ServicesContext.Provider
      value={{
        services,
        categories,
        loading,
        error,
        createService: handleCreateService,
        refetchServices: loadData
      }}
    >
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = () => useContext(ServicesContext);
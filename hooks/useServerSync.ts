// Hook để sync data với server backend
const BACKEND_URL = 'http://192.168.1.10:3001';

export const useServerSync = () => {
    // Load data từ server
    const loadFromServer = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/database`);
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
        } catch (error) {
            console.error('Error loading from server:', error);
        }
        return null;
    };

    // Save data lên server
    const saveToServer = async (data: any) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/database`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error saving to server:', error);
            return false;
        }
    };

    return { loadFromServer, saveToServer };
};

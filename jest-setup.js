// jest-setup.js
import '@testing-library/jest-native/extend-expect';


jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);


jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    })),
  },
}));


jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Share: {
    share: jest.fn(),
  },
}));
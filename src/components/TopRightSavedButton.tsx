// app/components/TopRightSavedButton/TopRightSavedButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TopRightSavedButtonProps {
    savedCount: number;
    onPress: () => void;
}

const TopRightSavedButton: React.FC<TopRightSavedButtonProps> = ({ savedCount, onPress }) => {
    return (
        <TouchableOpacity style={styles.topRightButton} onPress={onPress}>
            <Ionicons name="bookmark-outline" size={24} color="#555" />
            <Text style={styles.topRightButtonText}>Saved ({savedCount})</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    topRightButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
        zIndex: 5,
    },
    topRightButtonText: {
        marginLeft: 5,
        fontSize: 16,
        color: '#555',
        fontWeight: '500',
    },
});

export default TopRightSavedButton;
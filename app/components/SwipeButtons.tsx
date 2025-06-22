// app/components/SwipeButtons/SwipeButtons.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SwipeButtonsProps {
    onUndo: () => void;
    onDiscard: () => void;
    onSelect: () => void;
    canUndo: boolean;
    canSwipe: boolean;
}

const SwipeButtons: React.FC<SwipeButtonsProps> = ({ onUndo, onDiscard, onSelect, canUndo, canSwipe }) => {
    return (
        <View style={styles.buttonContainer}>
            <TouchableOpacity
                style={[styles.button, styles.undoButton, !canUndo && styles.buttonDisabled]}
                onPress={onUndo}
                disabled={!canUndo}
            >
                <Ionicons name="reload-circle-outline" size={30} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.discardButton, !canSwipe && styles.buttonDisabled]}
                onPress={onDiscard}
                disabled={!canSwipe}
            >
                <Ionicons name="close-circle-outline" size={40} color="#FF6347" />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.selectButton, !canSwipe && styles.buttonDisabled]}
                onPress={onSelect}
                disabled={!canSwipe}
            >
                <Ionicons name="checkmark-circle-outline" size={40} color="#3CB371" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 30,
        width: '80%',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 10,
    },
    button: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 3 },
    },
    undoButton: {
        backgroundColor: '#e0e0e0',
    },
    discardButton: {
        backgroundColor: '#ffe0e0',
    },
    selectButton: {
        backgroundColor: '#e0ffe0',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});

export default SwipeButtons;
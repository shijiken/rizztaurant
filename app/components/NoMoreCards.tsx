// app/components/NoMoreCards/NoMoreCards.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NoMoreCards: React.FC = () => {
    return (
        <View style={styles.noMoreCardsContainer}>
            <Text style={styles.noMoreCardsText}>No more restaurants for now!</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    noMoreCardsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noMoreCardsText: {
        fontSize: 20,
        color: '#888',
        textAlign: 'center',
        marginBottom: 20,
    },
});

export default NoMoreCards;
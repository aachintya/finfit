import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { chatWithAI, getInitialAnalysis } from '../utils/aiService';
import LottieView from 'lottie-react-native';

const ChatInterface = ({ summary, transactions, onClose }) => {
    const [messages, setMessages] = useState([
        {
            id: '1',
            text: "Hi! I'm your personal finance advisor from **Team Auxin.**  I'm analyzing your financial data...",
            isUser: false,
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const flatListRef = useRef();

    useEffect(() => {
        const fetchInitialAnalysis = async () => {
            try {
                const analysis = await getInitialAnalysis(summary, transactions);
                setMessages(prev => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        text: analysis,
                        isUser: false,
                    }
                ]);
            } catch (error) {
                console.error('Initial analysis error:', error);
                setMessages(prev => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        text: "I encountered an error analyzing your data. Feel free to ask me specific questions about your finances.",
                        isUser: false,
                    }
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialAnalysis();
    }, [summary, transactions]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMessage = {
            id: Date.now().toString(),
            text: inputText.trim(),
            isUser: true,
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await chatWithAI(inputText, summary, transactions);
            const aiMessage = {
                id: (Date.now() + 1).toString(),
                text: response,
                isUser: false,
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: 'Sorry, I encountered an error. Please try again.',
                isUser: false,
            };
            setMessages(prev => [...prev, errorMessage]);
        }

        setIsLoading(false);
    };

    const parseMessageText = (text) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g); 
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <Text key={index} style={{ fontWeight: 'bold' }}>
                        {part.slice(2, -2)}
                    </Text>
                );
            }
            return <Text key={index}>{part}</Text>;
        });
    };

    const renderMessage = ({ item }) => (
        <View
            style={[
                styles.messageContainer,
                item.isUser ? styles.userMessage : styles.aiMessage,
            ]}
        >
            <Text style={styles.messageText}>{parseMessageText(item.text)}</Text>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
            keyboardVerticalOffset={hp('10%')} // Adjust this as needed
        >
            <View style={styles.header}>
                <Text style={styles.headerText}>Financial Advisor Chat</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={wp('6%')} color={COLORS.text.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current.scrollToEnd({ animated: true })}
                ListFooterComponent={
                    isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color={COLORS.secondary} />
                            {/* <LottieView 
                            source={require("../assets/animation/thinking.json")}
                            loop
                            style={styles.loadingAnimation}
                            autoPlay/> */}
                        </View>
                    ) : null
                }
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type your message..."
                    placeholderTextColor={COLORS.text.secondary}
                    multiline
                    editable={!isLoading}
                />
                <TouchableOpacity
                    onPress={handleSend}
                    style={styles.sendButton}
                    disabled={isLoading || !inputText.trim()}
                >
                    <Ionicons
                        name="send"
                        size={wp('6%')}
                        color={inputText.trim() && !isLoading ? COLORS.secondary : COLORS.text.secondary}
                    />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: wp('4%'),
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightbackground,
    },
    headerText: {
        fontSize: wp('4.5%'),
        fontWeight: 'bold',
        color: COLORS.text.primary,
    },
    closeButton: {
        padding: wp('2%'),
    },
    messagesList: {
        padding: wp('4%'),
        flexGrow: 1,
    },
    messageContainer: {
        maxWidth: '80%',
        marginVertical: hp('1%'),
        padding: wp('4%'),
        borderRadius: wp('4%'),
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: COLORS.primary,
    },
    aiMessage: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.lightbackground,
    },
    messageText: {
        fontSize: wp('3.8%'),
        color: COLORS.text.primary,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: wp('4%'),
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.lightbackground,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.lightbackground,
        borderRadius: wp('4%'),
        padding: wp('3%'),
        marginRight: wp('2%'),
        color: COLORS.text.primary,
        fontSize: wp('3.8%'),
        maxHeight: hp('15%'),
    },
    sendButton: {
        padding: wp('2%'),
    },
    loadingContainer: {
        padding: wp('2%'),
        alignItems: 'center',
    },
    loadingAnimation:{
        height:wp(20),
        width:wp(20)
    }
});

export default ChatInterface;

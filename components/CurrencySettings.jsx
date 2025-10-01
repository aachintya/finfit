import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { COLORS } from "../constants/theme";

const CurrencySelector = ({ 
  visible, 
  onClose, 
  onSelectCurrency, 
  currentCurrency,
  loading,
  t // translation function
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
const allCurrencies = {
    AED: { symbol: 'د.إ', name: 'United Arab Emirates Dirham' },
    AFN: { symbol: '؋', name: 'Afghan Afghani' },
    ALL: { symbol: 'L', name: 'Albanian Lek' },
    AMD: { symbol: '֏', name: 'Armenian Dram' },
    ANG: { symbol: 'ƒ', name: 'Netherlands Antillean Guilder' },
    AOA: { symbol: 'Kz', name: 'Angolan Kwanza' },
    ARS: { symbol: '$', name: 'Argentine Peso' },
    AUD: { symbol: 'A$', name: 'Australian Dollar' },
    AWG: { symbol: 'ƒ', name: 'Aruban Florin' },
    AZN: { symbol: '₼', name: 'Azerbaijani Manat' },
    BAM: { symbol: 'KM', name: 'Bosnia-Herzegovina Convertible Mark' },
    BBD: { symbol: '$', name: 'Barbadian Dollar' },
    BDT: { symbol: '৳', name: 'Bangladeshi Taka' },
    BGN: { symbol: 'лв', name: 'Bulgarian Lev' },
    BHD: { symbol: '.د.ب', name: 'Bahraini Dinar' },
    BIF: { symbol: 'FBu', name: 'Burundian Franc' },
    BMD: { symbol: '$', name: 'Bermudan Dollar' },
    BND: { symbol: '$', name: 'Brunei Dollar' },
    BOB: { symbol: 'Bs.', name: 'Bolivian Boliviano' },
    BRL: { symbol: 'R$', name: 'Brazilian Real' },
    BSD: { symbol: '$', name: 'Bahamian Dollar' },
    BTN: { symbol: 'Nu.', name: 'Bhutanese Ngultrum' },
    BWP: { symbol: 'P', name: 'Botswanan Pula' },
    BYN: { symbol: 'Br', name: 'Belarusian Ruble' },
    BZD: { symbol: 'BZ$', name: 'Belize Dollar' },
    CAD: { symbol: 'C$', name: 'Canadian Dollar' },
    CDF: { symbol: 'FC', name: 'Congolese Franc' },
    CHF: { symbol: 'Fr', name: 'Swiss Franc' },
    CLP: { symbol: '$', name: 'Chilean Peso' },
    CNY: { symbol: '¥', name: 'Chinese Yuan' },
    COP: { symbol: '$', name: 'Colombian Peso' },
    CRC: { symbol: '₡', name: 'Costa Rican Colón' },
    CUP: { symbol: '₱', name: 'Cuban Peso' },
    CVE: { symbol: '$', name: 'Cape Verdean Escudo' },
    CZK: { symbol: 'Kč', name: 'Czech Koruna' },
    DJF: { symbol: 'Fdj', name: 'Djiboutian Franc' },
    DKK: { symbol: 'kr', name: 'Danish Krone' },
    DOP: { symbol: 'RD$', name: 'Dominican Peso' },
    DZD: { symbol: 'د.ج', name: 'Algerian Dinar' },
    EGP: { symbol: 'E£', name: 'Egyptian Pound' },
    ERN: { symbol: 'Nfk', name: 'Eritrean Nakfa' },
    ETB: { symbol: 'Br', name: 'Ethiopian Birr' },
    EUR: { symbol: '€', name: 'Euro' },
    FJD: { symbol: 'FJ$', name: 'Fijian Dollar' },
    FKP: { symbol: '£', name: 'Falkland Islands Pound' },
    GBP: { symbol: '£', name: 'British Pound Sterling' },
    GEL: { symbol: '₾', name: 'Georgian Lari' },
    GHS: { symbol: 'GH₵', name: 'Ghanaian Cedi' },
    GIP: { symbol: '£', name: 'Gibraltar Pound' },
    GMD: { symbol: 'D', name: 'Gambian Dalasi' },
    GNF: { symbol: 'FG', name: 'Guinean Franc' },
    GTQ: { symbol: 'Q', name: 'Guatemalan Quetzal' },
    GYD: { symbol: '$', name: 'Guyanaese Dollar' },
    HKD: { symbol: 'HK$', name: 'Hong Kong Dollar' },
    HNL: { symbol: 'L', name: 'Honduran Lempira' },
    HRK: { symbol: 'kn', name: 'Croatian Kuna' },
    HTG: { symbol: 'G', name: 'Haitian Gourde' },
    HUF: { symbol: 'Ft', name: 'Hungarian Forint' },
    IDR: { symbol: 'Rp', name: 'Indonesian Rupiah' },
    ILS: { symbol: '₪', name: 'Israeli New Shekel' },
    INR: { symbol: '₹', name: 'Indian Rupee' },
    IQD: { symbol: 'ع.د', name: 'Iraqi Dinar' },
    IRR: { symbol: '﷼', name: 'Iranian Rial' },
    ISK: { symbol: 'kr', name: 'Icelandic Króna' },
    JMD: { symbol: 'J$', name: 'Jamaican Dollar' },
    JOD: { symbol: 'د.ا', name: 'Jordanian Dinar' },
    JPY: { symbol: '¥', name: 'Japanese Yen' },
    KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
    KGS: { symbol: 'лв', name: 'Kyrgystani Som' },
    KHR: { symbol: '៛', name: 'Cambodian Riel' },
    KMF: { symbol: 'CF', name: 'Comorian Franc' },
    KPW: { symbol: '₩', name: 'North Korean Won' },
    KRW: { symbol: '₩', name: 'South Korean Won' },
    KWD: { symbol: 'د.ك', name: 'Kuwaiti Dinar' },
    KYD: { symbol: '$', name: 'Cayman Islands Dollar' },
    KZT: { symbol: '₸', name: 'Kazakhstani Tenge' },
    LAK: { symbol: '₭', name: 'Laotian Kip' },
    LBP: { symbol: 'ل.ل', name: 'Lebanese Pound' },
    LKR: { symbol: 'Rs', name: 'Sri Lankan Rupee' },
    LRD: { symbol: '$', name: 'Liberian Dollar' },
    LSL: { symbol: 'L', name: 'Lesotho Loti' },
    LYD: { symbol: 'ل.د', name: 'Libyan Dinar' },
    MAD: { symbol: 'د.م.', name: 'Moroccan Dirham' },
    MDL: { symbol: 'L', name: 'Moldovan Leu' },
    MGA: { symbol: 'Ar', name: 'Malagasy Ariary' },
    MKD: { symbol: 'ден', name: 'Macedonian Denar' },
    MMK: { symbol: 'K', name: 'Myanmar Kyat' },
    MNT: { symbol: '₮', name: 'Mongolian Tugrik' },
    MOP: { symbol: 'MOP$', name: 'Macanese Pataca' },
    MRU: { symbol: 'UM', name: 'Mauritanian Ouguiya' },
    MUR: { symbol: '₨', name: 'Mauritian Rupee' },
    MVR: { symbol: 'Rf', name: 'Maldivian Rufiyaa' },
    MWK: { symbol: 'MK', name: 'Malawian Kwacha' },
    MXN: { symbol: '$', name: 'Mexican Peso' },
    MYR: { symbol: 'RM', name: 'Malaysian Ringgit' },
    MZN: { symbol: 'MT', name: 'Mozambican Metical' },
    NAD: { symbol: '$', name: 'Namibian Dollar' },
    NGN: { symbol: '₦', name: 'Nigerian Naira' },
    NIO: { symbol: 'C$', name: 'Nicaraguan Córdoba' },
    NOK: { symbol: 'kr', name: 'Norwegian Krone' },
    NPR: { symbol: '₨', name: 'Nepalese Rupee' },
    NZD: { symbol: '$', name: 'New Zealand Dollar' },
    OMR: { symbol: '﷼', name: 'Omani Rial' },
    PAB: { symbol: 'B/.', name: 'Panamanian Balboa' },
    PEN: { symbol: 'S/.', name: 'Peruvian Nuevo Sol' },
    PGK: { symbol: 'K', name: 'Papua New Guinean Kina' },
    PHP: { symbol: '₱', name: 'Philippine Peso' },
    PKR: { symbol: '₨', name: 'Pakistani Rupee' },
    PLN: { symbol: 'zł', name: 'Polish Złoty' },
    PYG: { symbol: '₲', name: 'Paraguayan Guarani' },
    QAR: { symbol: 'ر.ق', name: 'Qatari Rial' },
    RON: { symbol: 'lei', name: 'Romanian Leu' },
    RSD: { symbol: 'дин.', name: 'Serbian Dinar' },
    RUB: { symbol: '₽', name: 'Russian Ruble' },
    RWF: { symbol: 'FRw', name: 'Rwandan Franc' },
    SAR: { symbol: '﷼', name: 'Saudi Riyal' },
    SBD: { symbol: '$', name: 'Solomon Islands Dollar' },
    SCR: { symbol: '₨', name: 'Seychellois Rupee' },
    SDG: { symbol: 'ج.س.', name: 'Sudanese Pound' },
    SEK: { symbol: 'kr', name: 'Swedish Krona' },
    SGD: { symbol: 'S$', name: 'Singapore Dollar' },
    SHP: { symbol: '£', name: 'Saint Helena Pound' },
    SLL: { symbol: 'Le', name: 'Sierra Leonean Leone' },
    SOS: { symbol: 'S', name: 'Somali Shilling' },
    SRD: { symbol: '$', name: 'Surinamese Dollar' },
    STN: { symbol: 'Db', name: 'São Tomé and Príncipe Dobra' },
    SVC: { symbol: '$', name: 'Salvadoran Colón' },
    SYP: { symbol: '£', name: 'Syrian Pound' },
    SZL: { symbol: 'L', name: 'Swazi Lilangeni' },
    THB: { symbol: '฿', name: 'Thai Baht' },
    TJS: { symbol: 'SM', name: 'Tajikistani Somoni' },
    TMT: { symbol: 'T', name: 'Turkmenistani Manat' },
    TND: { symbol: 'د.ت', name: 'Tunisian Dinar' },
    TOP: { symbol: 'T$', name: 'Tongan Paʻanga' },
    TRY: { symbol: '₺', name: 'Turkish Lira' },
    TTD: { symbol: 'TT$', name: 'Trinidad and Tobago Dollar' },
    TWD: { symbol: 'NT$', name: 'New Taiwan Dollar' },
    TZS: { symbol: 'TSh', name: 'Tanzanian Shilling' },
    UAH: { symbol: '₴', name: 'Ukrainian Hryvnia' },
    UGX: { symbol: 'USh', name: 'Ugandan Shilling' },
    USD: { symbol: '$', name: 'United States Dollar' },
    UYU: { symbol: '$U', name: 'Uruguayan Peso' },
    UZS: { symbol: 'лв', name: 'Uzbekistan Som' },
    VES: { symbol: 'Bs', name: 'Venezuelan Bolívar' },
    VND: { symbol: '₫', name: 'Vietnamese Dong' },
    VUV: { symbol: 'VT', name: 'Vanuatu Vatu' },
    WST: { symbol: 'WS$', name: 'Samoan Tala' },
    XAF: { symbol: 'FCFA', name: 'Central African CFA Franc' },
    XCD: { symbol: '$', name: 'East Caribbean Dollar' },
    XOF: { symbol: 'CFA', name: 'West African CFA Franc' },
    XPF: { symbol: '₣', name: 'CFP Franc' },
    YER: { symbol: '﷼', name: 'Yemeni Rial' },
    ZAR: { symbol: 'R', name: 'South African Rand' },
    ZMW: { symbol: 'ZK', name: 'Zambian Kwacha' },
    ZWL: { symbol: '$', name: 'Zimbabwean Dollar' }
  };
  const filteredCurrencies = Object.entries(allCurrencies).filter(([code, currency]) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      code.toLowerCase().includes(searchLower) ||
      currency.name.toLowerCase().includes(searchLower)
    );
  });

  const renderCurrencyItem = ({ item: [code, currency] }) => (
    <TouchableOpacity
      style={[
        styles.currencyOption,
        currentCurrency === code && styles.selectedCurrency
      ]}
      onPress={() => {
        onSelectCurrency(code);
        onClose();
      }}
    >
      <View style={styles.currencyContent}>
        <Text style={[
          styles.currencyText,
          currentCurrency === code ? styles.selectedText : styles.unselectedText
        ]}>
          {currency.symbol} {code}
        </Text>
        <Text style={[
          styles.currencySubtext,
          currentCurrency === code ? styles.selectedText : styles.unselectedText
        ]}>
          {currency.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('Select Default Currency')}</Text>
          
          <View style={styles.searchContainer}>
            <MaterialIcons 
              name="search" 
              size={wp('5%')} 
              color={COLORS.text.secondary} 
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t('Search currencies...')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.text.secondary}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.background} style={styles.loader} />
          ) : (
            <FlatList
              data={filteredCurrencies}
              renderItem={renderCurrencyItem}
              keyExtractor={([code]) => code}
              style={styles.currencyList}
              showsVerticalScrollIndicator={false}
            />
          )}

          <Text style={styles.note}>
            {t('Note: Exchange rates are updated daily')}
          </Text>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>{t('Close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker background for better contrast
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: wp('6%'), // Increased padding for a more spacious feel
    borderRadius: wp('4%'),
    width: wp('85%'),
    maxHeight: hp('80%'),
    shadowColor: '#000', // Added shadow for depth
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    // marginBottom: hp('2%'),
    textAlign: 'center',
    color: COLORS.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0', // Lighter background for search input
    borderRadius: wp('2%'),
    marginBottom: hp('2%'),
    paddingHorizontal: wp('4%'),
  },
  searchIcon: {
    marginRight: wp('2%'),
  },
  searchInput: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    fontSize: wp('4.5%'), // Slightly larger font size
    color: COLORS.background,
  },
  currencyList: {
    maxHeight: hp('45%'),
  },
  currencyOption: {
    padding: hp('2%'), // Increased padding for better touch targets
    borderRadius: wp('2%'),
    marginVertical: hp('0.5%'),
    backgroundColor: '#f9f9f9', // Slightly different background color
  },
  selectedCurrency: {
    backgroundColor: COLORS.primary,
  },
  currencyContent: {
    alignItems: 'flex-start',
  },
  currencyText: {
    fontSize: wp('4.5%'), // Slightly larger font size
    color: COLORS.text.primary,
    marginBottom: hp('0.3%'),
  },
  currencySubtext: {
    fontSize: wp('4%'), // Slightly larger font size
    color: COLORS.text.secondary,
  },
  selectedText: {
    color: 'white',
  },
  unselectedText: {
    color: COLORS.background, // Changed to Color.background when not selected
  },
  note: {
    marginTop: hp('2%'),
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontSize: wp('3.5%'),
  },
  closeButton: {
    marginTop: hp('2%'),
    padding: hp('1.5%'),
    backgroundColor: COLORS.primary, // Changed to primary color for visibility
    borderRadius: wp('2%'),
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: wp('4.5%'), // Slightly larger font size
  },
  loader: {
    marginVertical: hp('4%'),
  },
});

export default CurrencySelector;
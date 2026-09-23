import { Image, View } from 'react-native';

const TabIcon = ({ focused, icon }: TabIconProps) => (
    <View className={`items-center justify-center ${focused ? 'opacity-100' : 'opacity-50'}`}>
        <Image source={icon} className="w-6 h-6" resizeMode="contain" />
    </View>
);

export default TabIcon;

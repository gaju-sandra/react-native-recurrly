import {Image, View} from "react-native";
import {useUser} from "@clerk/expo";
import logo from "@/assets/icons/logo.png";

const UserAvatar = ({className}: { className?: string }) => {
    const {user} = useUser();


    if (user?.hasImage) {
        return <Image source={{uri: user.imageUrl}}
                      className={className}/>;
    }

    return (
        <View className={`${className ?? ""} overflow-hidden`}>
            <Image source={logo} className="size-full"
                   resizeMode="contain"/>
        </View>
    );
};

export default UserAvatar;

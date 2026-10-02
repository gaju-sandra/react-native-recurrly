import {useMemo} from "react";
import {Image, View} from "react-native";
import {SvgXml} from "react-native-svg";
import {useUser} from "@clerk/expo";
import {createAvatar} from "@dicebear/core";
import * as adventurer from "@dicebear/adventurer";

// Shows the user's uploaded photo, otherwise a generated avatar seeded by their
// Clerk id, so every account gets its own avatar and it never changes between sign-ins.
// Clerk always returns an imageUrl (a generic default), so check hasImage instead.
const UserAvatar = ({className}: { className?: string }) => {
    const {user} = useUser();
    const seed = user?.id ?? "guest";

    const svg = useMemo(
        () => createAvatar(adventurer, {seed, backgroundType: ["solid"], backgroundColor: ["f6eecf", "8fd1bd", "b8d4e3", "e8d5f0", "ffd8a8"]}).toString(),
        [seed],
    );

    if (user?.hasImage) {
        return <Image source={{uri: user.imageUrl}} className={className}/>;
    }

    return (
        <View className={`${className ?? ""} overflow-hidden`}>
            <SvgXml xml={svg} width="100%" height="100%"/>
        </View>
    );
};

export default UserAvatar;

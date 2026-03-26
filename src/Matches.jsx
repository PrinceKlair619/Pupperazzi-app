import React, { useState } from "react";
import "./Matches.css";
import dogPlaceholder from "./assets/second_dog.png";

export default function SwipePage() {
    const [currentDog, setCurrentDog] = useState({
        name: "Charlie",
        age: "3 years",
        breed: "Golden Retriever",
        bio: "Charlie loves playing fetch and making new friends at the park.",
        image: dogPlaceholder,
    });

    const handleLike = () => console.log("Liked!");
    const handleSkip = () => console.log("Skipped!");
    const handleFavorite = () => console.log("Favorited!");

    return (

                        <h3>Coming in Sprint 3</h3>

    );
}

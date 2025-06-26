const promptGuide = `# Ideogram Prompting Guide: The Basics

## Introduction
This guide will help you understand prompting on Ideogram step by step. Throughout this guide:
- Text in **green** means new or added text to a previous prompt
- ~~Strikethrough purple text~~ means text removed from a previous prompt

For all examples below, we'll use the following settings:
- Magic Prompt set to OFF
- Aspect ratio of 1:1
- Model v1.0 or 2.0 as specified

## 1- A Very Basic Prompt
Let's start with a very basic prompt:

**Prompt:**
A boy on a neutral grey background.

Nothing complicated here. The image of a boy and a neutral grey background as requested. Now let's add more details...

## 2- Adding Details
Let's add some specific details like hair and eye color, clothing, and a more interesting background.

**Prompt:**
A boy on a neutral grey background with sandy hair and blue eyes, wearing a checked shirt, against a backdrop of wooden planks.

This one is more beautiful. Perhaps a little too static. Let's try to make it more dynamic...

## 3- A Point of View
OK, that previous prompt and the image it generated were still ordinary. Perhaps changing the angle and/or the point of view would produce a more interesting image?

**Prompt:**
A boy with sandy hair and blue eyes, wearing a checked shirt, left-sided partial profile pose, against a backdrop of wooden planks.

Almost a studio photo isn't it?

Note: there are also other terms used to achieve this pose, such as three-quarter pose, or slightly turned to the left, etc.

## 4- Adding Elements
Why not add a few elements to make the overall image more attractive?

**Prompt:**
A boy with sandy hair and blue eyes, wearing a checked shirt and jeans, sitting cross-legged on the floor, beside a friendly dog, between them both there is a house plant in a pot, against a backdrop of wooden planks.

Note how well the AI has rendered all the requested elements and their relative positioning in the image composition. Now let's change the mood next...

## 5- Make a Lively Scene
Until now, images have been rather static. Let's change that.

**Prompt:**
A boy with sandy hair and blue eyes, wearing a checked shirt and jeans, playing with a friendly Golden Retriever, in a park on a sunny day.

The addition of an environment contributes greatly to the atmosphere of a picture. And everyone knows that the Golden Retriever is a child's best friend. 😉

## 6- Different Styles
So far, the AI has provided us with photograph-like images without us even asking. There are also predefined style tags that can be selected and added to the prompt to specify the style of image we want to generate.

These are really just words added at the end of the prompt to specify the style you want. So if you select 'illustration', it is the same as if you've added the word 'illustration' at the end of your prompt.

Many of these 'tags' are less effective, or even ineffective, when you use the v1.0 model, depending on the subject of the prompt. They are still very useful in older versions v0.1 and v0.2. Version 1.0 has a different "language" approach compared to its two predecessors.

**Prompt:**
A boy with sandy hair and blue eyes, wearing a checked shirt and jeans, playing with a friendly Golden Retriever, in a park on a sunny day, illustration.

**Prompt:**
A boy with sandy hair and blue eyes, wearing a checked shirt and jeans, playing with a friendly Golden Retriever, in a park on a sunny day, 3d render.

**Prompt:**
A boy with sandy hair and blue eyes, wearing a checked shirt and jeans, playing with a friendly Golden Retriever, in a park on a sunny day, anime.

With Ideogram version 1.0, it's generally more efficient to integrate the desired style directly into the prompt. Let's try this next...

## 7- Integrating Styles
Let's put some stylistic details in the original prompt and see the results.

Original **Prompt:**
A boy with sandy hair and blue eyes, wearing a checked shirt and jeans, playing with a friendly Golden Retriever, in a park on a sunny day.

**Prompt:**
Washed-out soft watercolour painting featuring a boy with sandy hair and blue eyes, wearing a checked shirt and jeans, playing with a friendly Golden Retriever, in a park on a sunny day.

**Prompt:**
A rough pencil sketch featuring a boy with sandy hair and blue eyes, wearing a checked shirt and jeans, playing with a friendly Golden Retriever, in a park on a sunny day.

**Prompt:**
An origami art featuring a boy with sandy hair and blue eyes, wearing a checked shirt and jeans, playing with a friendly Golden Retriever, in a paper-art park on a sunny day.

Of course, you can mix and match all the styles to your heart's content.

**Prompt:**
Soft, faded and minimalist watercolour painting with black ink pen outlines, featuring a boy wearing a checked shirt and jeans, playing with a friendly Golden Retriever, in a park on a sunny day.

## 8- Add Some Text
Let's say you want to give your image a title, as if you were making a book cover.

**Prompt:**
Washed-out soft watercolour painting featuring a boy with sandy hair and blue eyes, wearing a checked shirt and jeans, playing with a friendly Golden Retriever, in a park on a sunny day. At the top of the image, the book title is: "Michael and his dog" in a child-book type of title typography. At the bottom, the author's name: "John Johnson"

Not everyone is going to make children's books, so let's try other subjects.

**Prompt:**
A sleek and modern illustration of a logo for "PetPalace" featuring a minimalist stylized image of a regal cat wearing a crown, sitting next to a luxurious palace.

**Prompt:**
Close up photo of a beer can with a big modern sailor's anchor inspired logo named "Mariner's Brew" in big letters, a full glass of beer in the background, on the counter of an Irish pub, dynamic view, studio photography, food photography.

**Prompt:**
A cool cat wearing a hat and sunglasses playing the saxophone with his paws on the stage of a jazz club, a neon sign in the background saying: "Cool Cat Jazz". Intense atmosphere, dark ambience, dark tones, jazz club genre, 40's and 50's look.

Enclosing text in a phrase between quotes " " seems the best way to make the AI understand it needs to render the text in the image.

## The Importance of Precision

### Precision to Avoid Confusion
In your prompt, if you write: "A painting of a cat." you will probably get something painterly. But being precise might get you better results.

**Prompt:**
A painting figuring a cat sleeping next to the fireplace.

**Prompt:**
An abstract painting figuring a cat sleeping next to the fireplace.

**Prompt:**
An abstract impasto painting figuring a cat sleeping next to the fireplace.

**Prompt:**
A soft minimalist watercolor painting figuring a cat sleeping next to the fireplace.

**Prompt:**
A fancy and colorful rococo painting figuring a cat sleeping next to the fireplace.

**Prompt:**
A pop art painting figuring a cat sleeping next to the fireplace.

As you can see, precision determines the kind of painting you want. The same applies to just about everything you want to put in your prompt. The more precise you are, the more likely you are to generate the image you want.

### In That Order, Please
Ideogram AI, version 1.0 and up, will be very observant of the instructions you put in your prompt. Here are a few examples:

**Prompt:**
Photograph of a tortoise, a squirrel, a cat and a dog are placed in a line in front of a sofa in the living room where a woman, a little girl, a little boy and a man are sitting.

**Prompt:**
A vibrant photography featuring three women side by side. The woman on the left has deep blue hair, a red dress and holds a green sign that says "RGB". The one in the middle has magenta/pink hair, a cyan dress and a black belt and holds a yellow sign that says "CMYK". The last one is in grayscale, has a grey dress and holds a sign that says "Grayscale". They are standing in a living room where there's a sofa behind them a big plant on the left and a floor lamp on the right.

**Prompt:**
A stunning photograph of three beautifully labelled jam jars displayed on a pristine kitchen counter. The first jar on the left, in the foreground, is a blueberry jam jar, with a blueberry adorning its lid. The second jar, in the middle and slightly recessed, is a jar of strawberry jam, featuring a large, juicy strawberry as its lid decoration. The third jar, on the right and farthest back, is a jar of orange marmalade, with an orange elegantly placed on its lid. The overall atmosphere of the image is warm and inviting, with the jars' colors and labels evoking a sense of nostalgia and comfort.

See how Ideogram can adhere to what you describe in your prompt, often with great precision.

### Avoid Contradictions
In this example we will see how a simple notion or a simple word may affect the image being generated.
Here we want a photographic portrait of a young boy, from the waist up. We also want to describe as many elements and other aspects as possible.

**Prompt:**
Portrait photo of a young boy blond boy, with blue eyes, wearing headphones, a deep red hoodie and jeans, and red sneakers, in front of a music store.

Can you see the difference? If you describe something, the AI will always try to show it to you, even if you've specifically asked for a certain style that usually prevents you from seeing it. By simply removing some unnecessary descriptions, we were able to get exactly what we wanted.

### Gradation and Relative Sizes
Huge, big, normal, small, minuscule… Using the right qualifier to describe the importance of an element in an image is a simple way of defining an order of proportion. Let's look at an example:

**Prompt:**
A striking and vivid magazine cover, featuring an anthropomorphic cat exuding wealth and success sitting on an armchair, a paws on each arm. The cat is dressed in a tailored suit and dark sunglasses, striking a confident pose in an opulent living room. The huge magazine modern title in sans-serif font of "Cat Life" dominates the cover, a smaller mention "magazine" just under it on the right side, while the big headline "How I Make Them Clean the Litter Box Every Day" piques the reader's curiosity. The second smaller headline read: "The full story". The dynamic lighting enhances Mr. Whiskers' regal presence, making this a truly unique and memorable cover.

The simple way of describing the relative sizes for each text element was sufficient to produce an expected result.

Due to the complexity of the text and visual composition, this image needed more than one attempt to get it done like this.

## Using Magic Prompt
The Magic Prompt feature in Ideogram can be very helpful to provide additional content, details, ambiance and stylistic information in a prompt. The more basic the prompt, the more Magic Prompt will add to it.

### From Basic to Magic
Let's use a simple prompt and use it to explore what the Magic Prompt would come up with.

Original prompt:
A boy with a dog in a park.

When used, the Magic Prompt function generates a new, improved and embellished prompt based on your original prompt, then sends it to the AI to generate an image based on this new prompt. Here are two examples:

**Magic Prompt:**
A heartwarming scene of a young boy playing with his happy, wagging dog in a lush, green park. The boy has a playful smile on his face while he tosses a bright yellow ball for his furry friend to fetch. The park is filled with beautiful flowers and trees, creating a serene atmosphere for this bonding moment between boy and dog.

**Magic Prompt:**
A charming image of a young boy playing with a cute, wagging-tail dog in a lush green park. The boy's joyful smile and the dog's playful eyes convey a sense of happiness and connection. The park is full of colorful flowers and trees, with a sunny sky overhead. The overall atmosphere of the image is serene and uplifting.

Even if there is no mention of any style in the original prompt or in the Magic Prompts, the AI decided to generate the images in styles that seemed appropriate for the text.

### Styles with Magic Prompt
The Magic Prompt also allows you to illustrate and explain in greater detail a basic style that you can request in your prompt. Here's an example:

Original prompt:
A boy with a dog in a park, abstract art.

**Magic Prompt:**
A captivating abstract art piece featuring a boy playing with a dog in a park. The park is filled with vibrant colors, and the boy and the dog are depicted in bold, swirling lines. The background is a blend of various shapes and textures, conveying a sense of movement and energy.

**Magic Prompt:**
An abstract painting of a boy and a dog playing in a park. The boy is holding a ball, and the dog is running with a playful expression. The park is full of vibrant colors, with trees, flowers, and a winding path. The overall atmosphere of the painting is lively and joyful.

**Magic Prompt:**
A vibrant abstract painting of a boy playing with a dog in a lush park. The background is a swirl of vivid colors, representing the park's foliage and sky. The boy and the dog are in a dynamic pose, with the dog's ears flapping and the boy's arm extended. The overall art piece exudes a joyful and playful atmosphere.

As you can see, the Magic Prompt has expanded on the original prompt while expanding and refining certain aspects of the requested style. Each proposal gave a relatively different image, while remaining within the parameters of the original prompt.

### Magic Prompt for Inspiration
We all suffer from a lack of inspiration, the so-called blank page syndrome. To help you get started and stimulate your creativity, there's nothing like using the Magic Prompt. Let's look at a few examples.

Original prompt:
Create a logo for a coffee shop named "Mocha Comfort"

**Magic Prompt:**
A warm and inviting coffee shop logo for "Mocha Comfort" featuring a steaming mug of coffee with a swirl of rich mocha. The coffee is surrounded by a comfortable, cozy chair, and a warm, glowing fireplace. The overall design exudes a sense of relaxation and contentment, with a touch of elegance and sophistication.

**Magic Prompt:**
A modern and stylish logo for "Mocha Comfort" features a steaming coffee cup with a swirl of creamy mocha on top. The cup is paired with a cozy-looking armchair, evoking a sense of relaxation and comfort. The text of the name, "Mocha Comfort," is written in an elegant, cursive font, with the "C" in "Comfort" shaped like a comfy cushion. The overall design is warm and inviting, perfect for a coffee shop that offers a cozy and relaxing atmosphere.

**Magic Prompt:**
A cozy and inviting logo for "Mocha Comfort" coffee shop, featuring a steaming hot mocha with a whipped cream topping and a cherry on top. The coffee cup is adorned with a comfortable, plush heart, symbolizing love and warmth. The overall design is in a modern, minimalistic style, with a subtle, earthy color palette.
`;

export default promptGuide; 
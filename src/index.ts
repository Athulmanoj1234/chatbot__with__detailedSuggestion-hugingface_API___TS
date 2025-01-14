
import readline from 'node:readline';
import dotenv from 'dotenv';


async function getCompleted(){

dotenv.config();
const api_key = process.env.API_KEY;    
const { HfInference } = await import("@huggingface/inference");
const client = new HfInference(api_key);

let out: String = "";
let prompts: String[] = [];
let detailedSuggestion: string[] = [];

//accepting input for query 
const rl: readline.Interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  }); 

const questionQuery: String = await new Promise<String>((resolve) => {
    rl.question("write your query : ", (question)=> {
        resolve(question); 
    }) 
}) 

const stream = client.chatCompletionStream({
	model: "google/gemma-2-2b-it",
	messages: [
		{
			role: "user",
			content: `${questionQuery} and provide three ideas in numbers`
		}
	],
	max_tokens: 500 
}); 

for await (const chunk of stream) {
	if (chunk.choices && chunk.choices.length > 0) {
		const newContent: string | undefined = chunk.choices[0].delta.content;
		out += newContent;
		//console.log(newContent);
        prompts.push(newContent);
    }  
}

let newPrompts = prompts.join("").split("\n");  //the words in array was separated in comas and we have joined each word in array to a string an dwe have split the string in each line and each line have been stored into different indexas different elements
const filteredMethods = newPrompts.filter((line: String)=> 
    line.trim().startsWith("1.") ||  //return string elements in array starts with 1.
    line.trim().startsWith("2.") ||
    line.trim().startsWith("3."));

//create a new array with no special characters but only clean string    
console.log(filteredMethods.map((prompt: String)=> {
   return prompt.replace(/['**"]/g, ""); //removed singlequote(') doublequote(") and asterisks(*) 
})); 

//accepting two numbers for returning two elements in string
const queryIndexOne: number = await new Promise<number>(resolve=> {
    rl.question("enter first query number for detailed suggestion : ", (answer)=>{
       resolve(parseInt(answer)); //converts string answers into integers
    });
}); 

//accepting second query
const queryIndexTwo: number = await new Promise<number>(resolve=> {
    rl.question("enter second query number for detailed suggestion : ", (answer)=> {
       resolve(parseInt(answer)); //converts string answers into string
    });
});

if(queryIndexOne <= 0 || queryIndexOne > 3 || queryIndexTwo <= 0 || queryIndexTwo > 3){
    console.log("please enter a number between array indexes ie 0 and 3");
}
//filter the elements based on the users query index
const elementsToDetailed: string[] = filteredMethods.filter((query: string)=> {
    return query.startsWith(`${queryIndexOne}.`) || query.startsWith(`${queryIndexTwo}.`);
});

elementsToDetailed && elementsToDetailed.length > 0 ? console.log(elementsToDetailed) : "";

const firstSuggestion: string = elementsToDetailed[0];
const secondSuggestion: string = elementsToDetailed[1];
//console.log("this is first suggestion input:" + firstSuggestion + "this is second suggestion input:" + secondSuggestion);

//creating second chat completion stream for detailed query suggestions
const stream2 = client.chatCompletionStream({
	model: "google/gemma-2-2b-it",
	messages: [
		{
			role: "user",
			content: `provide detialed suggestion for these two queries query one is ${firstSuggestion} and query two is ${secondSuggestion} and answer these queries in two numbers ie no 1 and no 2`
		}
	],
	max_tokens: 500 
});

for await (const chunk of stream2) {
	if (chunk.choices && chunk.choices.length > 0) {
		const newContent: string | undefined = chunk.choices[0].delta.content;
		out += newContent;
		//console.log(newContent);
        detailedSuggestion.push(newContent);
    }  
}

setTimeout(function(){
    console.log("suggestion queries are generating...");
}, 1000);

//generating detailed suggestion queries after 2 seconds by setTimeOut
setTimeout(function(){
console.log(detailedSuggestion.join("").replace(/[**]/g, ""));
 }, 2000);
} 


try{
    getCompleted();    
}catch(err){
    console.log("cannot connect to hugging face api", err);
}
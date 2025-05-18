/**
   A Web Component that creates a pie chart. Currently rudementary, but it will
   get better, I swear!
 */

class Pie extends HTMLElement {
    constructor() {
        /* necessary boilerplate */
        super();

	    /* create a shadow dom. open means that shadowRoot can edit */
        const shadow = this.attachShadow({ mode: "open" });

        /* create a div container. this is the pie chart itself */
        const pieChart = document.createElement("div");

        /* the pie itself should fill up as much as possible as a circle */
        pieChart.style.width = "100%";
        pieChart.style.aspectRatio = "1 / 1";
        pieChart.style.borderRadius = "50%";

        /* read in the inputted data, and convert to an array of Numbers.
            avoids unnecessary memory creation */
        const A = this.innerHTML
            .trim() /* remove space from either side */
            .split(" ") /* split on spaces (gives array of strings) */
            .map(s => Number(s)); /* cast them into numbers */

        /* the only error cases we need cover, since the input is guaranteed to
            be an array of strings

            https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number#number_coercion
            */
        if (A.includes(NaN) || A.includes(Infinity) || A.includes(-Infinity)) {
            console.error(
                "pie-chart: failed to parse data:\n",
                this.innerHTML,
                "\nShould be numbers separated by spaces. For example:\n\n",
                "'40 60 200 30 8 10 900'\n\n"
            );
        }

        /* convert the array of raw number data into an array of ending angles
            out of 360 degrees */
        const A360 = this.createSlices(A);

        /* create a cycle of colors so that each slice looks distinct
            TODO: add logic to make colors more custom, maybe with some sort of
            logic to enforce a minimum contrast */
        const colors = ["red", "yellow", "orange", "blue", "purple", "black"];
        const colorCycle = cycle(colors);

        /* create a call to conic-gradient by concatenating strings. This could
            result in some sort of injection, but I think the casting above
            """should""" mitigate that risk. I mean, the code is being run on
            the client's PC anyways, so it's their own fault if they hack their
            own computer */
        const start = `conic-gradient(`;
        const [innerColors, _] = A360.reduce(
            (accTup, endAngle) => {
                /* the old endAngle becomes the startAngle*/
                const [acc, startAngle] = accTup;

                /* add "<color> <startAngle>deg <endAngle>deg, " to string */
                const next = acc +
                    `${colorCycle.next().value} ` +
                    `${startAngle}deg ${endAngle}deg, `;

                /* recursively call with a new acc and startAngle */
                return [next, endAngle]
            }, ["", 0] /* [accumulator, previous element] */
        );
        const end = `)`;

        /* the slice is to remove the trailing comma */
        const s = start + innerColors.slice(0, -2) + end;

        /* set the "background" to the pie chart */
        pieChart.style.background = s;

        /* Now that processing is done, make the element visible */
        this.style.visibility = "visible";

        /* finally, add it to the shadow dom */
        shadow.appendChild(pieChart);
    }

    /**
     * Method to convert an array of raw data to an array of ending angles
     * . Does not have to be out of 360, 100, etc.
     * 
     * @param {Array<Number>} A - Input an array of numbers for the raw
     *  data to be graphed
     * @returns {Array<Number>} - Returns an array of numbers for the ending
     *  angles for each number to be graphed
     */
    createSlices(A) {
        /* sum of all the data */
        const total = A.reduce((acc, a) => acc + a, 0);
        
        /* makes more sense if thought of as 360 * (a / total).
            the parenthesis tries to minimize floating point math error */
        const A360 = A.map(a => (360 * a) / total);

        /* turn A360 into a cumulative version (where each slice ends) */
        const [A360Cumulative, _] = A360.reduce(
            (accTup, a) => {
                /* works by having an accumulator array (endpoints), and
                    cumulative count in accTup*/
                const [acc, cumulativeAngle] = accTup;

                /* calculate the new endpoint of a slice by adding the size of
                    the slice (a) to the current cumulative amount (cum) */
                const newCumulativeAngle = cumulativeAngle + a;

                /* recur with a new accumulator and cumulative count */
                return [acc.concat([newCumulativeAngle]), newCumulativeAngle]
            }, [[], 0] /* start with an empty list and a 0 cumulative count */
        )
        
        /* return a list of cumulative count endpoints */
        return A360Cumulative;
    }
}

/**
 * A helper function that creates a cycle out of an Array as an iterator (or
 * generator)
 * 
 * @param {Array} arr - an array of any type
 * @yields {Object} - Object with "value" and "done" (will never be done, it
 *  loops infinitely)
 * */
function* cycle(arr) {
    const [h, ...t] = arr

    yield h

    /* "yield*" means "yield delegation", or delegate iteration to another
        object. in this case, a recursive call to cycle */
    yield* cycle(t.concat([h]));
}

customElements.define("pie-chart", Pie);

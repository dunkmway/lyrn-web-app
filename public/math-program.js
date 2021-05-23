let studentProfileData = {};
let studentNotesData = {};
let studentSTProfileData = {};

const studentGrade = 11;
let currentLessonData = {};
let date = new Date()
let colors = {'assigned' : 'yellow', 'needs help' : 'red', 'mastered' : 'green', 'not assigned' : 'blank'}
const links = ['https://www.khanacademy.org/math/cc-1st-grade-math',
               'https://www.khanacademy.org/math/cc-2nd-grade-math',
               'https://www.khanacademy.org/math/cc-third-grade-math',
               'https://www.khanacademy.org/math/cc-fourth-grade-math',
               'https://www.khanacademy.org/math/cc-fifth-grade-math',
               'https://www.khanacademy.org/math/cc-sixth-grade-math',
               'https://www.khanacademy.org/math/cc-seventh-grade-math',
               'https://www.khanacademy.org/math/cc-eighth-grade-math',
               'https://www.khanacademy.org/math/cc-eighth-grade-math',
               'https://www.khanacademy.org/math/cc-eighth-grade-math',
               'https://www.khanacademy.org/math/cc-eighth-grade-math'];

main();
function main() {
  retrieveInitialData()
  .then(() => {
    setStudentProfile();
    setStudentSTProfile();
    getNotes('log');
  })
}

const grade1 = {'Place Value' : ['Numbers 0 to 120', 'Ones and tens', 'Comparing 2-digit numbers'],
                'Addition and Subtraction' : ['Relate addition and subtraction', 'Adding within 20', 'Subtraction within 20', 'Equal sign', 'Missing number within 20', 'Word problems within 20', "Word problems with 'more' and 'fewer'", "Adding 1's and 10's", 'Intro to addition with 2-digit numbers'],
                'Measurement, Data, and Geometry' : ['Length and size', 'Bar graphs', 'Time', 'Shapes', 'Fractions of shapes']}

const grade2 = {'Place Value' : ['Hundreds', 'Comparing 3-digit numbers'],
                'Addition and Subtraction within 100' : ['Repeated addition', 'Adding 1s and 10s', 'Subtracting 1s and 10s', 'Intro to addition with 2-digit numbers', 'Intro to subtraction with 2-digit numbers', 'Strategies for adding and subtracting within 100', 'Addition within 100', 'Subtraction within 100', 'Word problems within 100', 'Word problems with "more" and "fewer" (within 100)', 'Skip-counting', 'Addition and subtraction missing value problems'],
                'Addition and Subtraction within 1000' : ['Adding 1s, 10s and 100s', 'Subtracting 1s, 10s, and 100s', 'Strategies for adding 2- and 3-digit numbs'], 
                'Measurement, Data, and Geometry' : ['Measuring length', 'Comparing and estimating length', 'Length word problems', 'Picture graphs', 'Bar graphs', 'Line plots', 'Time', 'Money', 'Shapes', 'Fractions of shapes']}

const grade3 = {'Addition and Subtraction' : ['Strategies for adding 2- and 3-digit numbers', 'Adding with regrouping within 1000', 'Subtracting with regrouping within 1000', 'Addition and subtraction missing value problems'],
               'Multiplication and Division' : ['Multiplication intro', 'Multiplication facts', 'Relating multiplication and division', 'Division intro', 'Division facts', 'More with 1-digit multiplication and division', 'Properties of multiplication', 'One and two-step word problems', 'Multiplying by tens', 'Patterns in arithmetic'],
               'Fractions' : ['Fractions intro', 'What fractions mean', 'Fractions on the number line', 'Fractions and whole numbers', 'Equivalent fractions', 'Equivalent fractions on the number line', 'Comparing fractions', 'Comparing fractions of different wholes'],
               'Measurement and Data' : ['Time', 'Mass', 'Volume', 'Bar graphs', 'Picture graphs', 'Line plots'], 
               'Geometry' : ['Area intro', 'Count unit squares to find area', 'Area formula intuition', 'Multiply to find area', 'Area and the distributive property', 'Decompose figures to find area', 'Perimeter', 'Comparing area and perimeter', 'Perimeter word problems', 'Quadrilaterals'], 
               'Place Value and Rounding' : ['Rounding']}

const grade4 = {'Measurement and Data' : ['Estimating mass', 'Estimating volume', 'Estimating length', 'Time', 'Converting units of mass', 'Converting units of volume', 'Converting units of length', 'Converting units of time', 'Money word problems', 'Conversion word problems', 'Area and perimeter', 'Line plots with fractions'],
                'Geometry' : ['Lines, line segments, and rays', 'Parallel and perpendicular', 'Angle introduction', 'Measuring angles', 'Constructing angles', 'Angles in circles', 'Angle types', 'Decomposing angles', 'Line of symmetry', 'Classifying triangles', 'Classifying geometric shapes'],
                'Factors, Multiples, and Patterns' : ['Factors and multiples', 'Prime and composite numbers', 'Math patterns'],
                'Place Value and Rounding' : ['Intro to place value', 'How 10 relates to place value', 'Ways to write whole numbers (expanded and written)', 'Regrouping whole numbers', 'Comparing multi-digit numbers', 'Rounding whole numbers']}

const grade5 = {'Addition and Subtraction' : ['Common fractions and decimals', 'Adding decimals intro', 'Adding decimals', 'Subtracting decimals intro', 'Subtracting decimals'],
                'Multiplication and Division' : ['Multi-digit multiplication', 'Multiplying decimals', 'Multi-digit division', 'Dividing decimals'],
                'Fractions' : ['Visually adding and subtracting fractions with unlike denominators', 'Common denominators', 'Adding and subtracting fractions with unlike denominators', 'Adding and subtracting mixed number with unlike denominators', 'Adding and subtracting fractions with unlike denominators word problems', 'Multiplication as scaling', 'Multiplying fractions and whole numbers', 'Multiplying fractions and whole numbers word problems', 'Multiplying fractions', 'Multiplying mixed numbers', 'Multiplying fractions word problems', 'fractions as division', 'Dividing unit fractions by whole numbers', 'Dividing whole numbers by unit fractions', 'Dividing fractions and whole numbers word problems'],
                'Place Value and Decimals' : ['Decimal place value intro', 'Decimals in expanded form', 'Decimals in written form', 'Comparing decimals', 'Rounding decimals', 'Multiplying and dividing whole numbers by 10, 100, and 1000', 'Multiplying and dividing decimals by 10, 100, and 1000', 'Powers of 10', 'Multiplying and dividing with powers of 10', 'Comparing decimal place values', 'Regrouping decimal numbers'],
                'Measurement and Data' : ['Volume intro', 'Finding volume', 'Unit conversion', 'Unit measurement word problems', 'Data'],
                'Geometry' : ['Intro to the coordinate plane', 'Coordinate plane word problems', 'Quadrilaterals'],
                'Algebraic Thinking' : ['Writing expressions', 'Number patterns']}

const grade6 = {'Ratios, Rates, and Percentages' : ['Intro to ratios','Equivalent ratios', 'Visualize ratios', 'Ratio application', 'Intro to rates', 'Intro to percents', 'Percent, decimal, fraction conversions', 'Percent problems', 'Percent word problems'],
                'Arithmetic Operations' : ['Adding decimals', 'Subtracting decimals', 'Adding and subtracting decimals word problems', 'Multiplying decimals', 'Dividing whole numbers', 'Dividing decimals', 'Dividing fractions by fractions', 'Exponents', 'Order of Operations'],
                'Negative Numbers' : ['Intro to negative numbers', 'Negative decimals and fractions on the number line', 'Number opposites', 'Comparing negative numbers', 'Negative symbol as opposite', 'Absolue value', 'Coordinate plane'],
                'Properties of Numbers' : ['Properties of numbers', 'Whole numbers and integers', 'Least common multiple', 'Greatest common factor'],
                'Variables and Expressions' : ['Parts of algebraic expressions', 'Substitution and evaluating expressions', 'Expression value intuition', 'Evaluating expressions word problems', 'Writing algebraic expressions introduction', 'Writing basic algebraic expressions word problems', 'Distributive property with variables', 'Combining like terms', 'Equivalent expressions'],
                'Equations and Inequalities Introduction' : ['Algebraic equations basics', 'One-step equations intuition', 'One-step addition and subtraction equations', 'One-step multiplication and division equations', 'Finding mistakes in one-step equations', 'One-step equation word problems', 'Intro to inequalities with variables', 'Dependent and independent variables'],
                'Geometry' : ['Areas of parallelograms', 'Areas of triangles', 'Area of composite figures', 'Geometric solids (3D shapes)', 'Volume with fractions', 'Surface area', 'Polygons on the coordinate plane'],
                'Data and Statistics' : ['Dot plots and frequency tables', 'Statistical questions', 'Histograms', 'Mean and median', 'Mean and median challenge problems', 'Interquartile range (IQR)', 'Box plots', 'Mean absolute deviation (MAD)', 'Comparing data displays', 'Shape of data distributions']}

const grade7 = {'Negative Numbers: Addition and Subtraction' : ['Intro to adding negative numbers', 'Intro to subtracting negative numbers', 'Adding and subtracting with negative numbers on the number line', 'Adding and subtracting integers', 'Adding and subtracting negative fractions', 'Addition and subtraction word problems with negatives', 'Absolute value', 'Properties of addition and subtraction', 'Adding and subtracting negative numbers: variables'],
                'Negative Numbers' : ['Multiply and divide negative numbers', 'Multiplication and division word problems with negatives', 'Understanding multiplying and dividing fractions', 'Multiply and divide negative fractions', 'Order of operations', 'Properties of multiplication and division'],
                'Fractions, Decimals, and Percentages' : ['Converting fractions to decimals', 'Adding and subtracting rational numbers', 'Percent word problems', 'Rational number word problems'],
                'Rates and Proportional Relationships' : ['Rate problems with fractions', 'Constant of proportionality', 'Compare and interpret constants of proportionality', 'Identifying proportional relationships', 'Graphs of proportional relationships', 'Writing and solving proportions', 'Equations of proportional relationships'],
                'Expressions, Equations, and Inequalities' : ['Combining like terms', 'The distributive property and equivalent expressions', 'Interpreting linear expressions', 'Two-step equations intro', 'Two-step equations with decimals and fractions', 'Two-step equation word problems', 'One-step inequalities', 'Two-step inequalities'],
                'Geometry' : ['Area and circumference of circles', 'Area and circumference challenge problems', 'Vertical, complementary, and supplementary angles', 'Missing angle problems', 'Constructing triangles', 'Slicing geometric shapes', 'Scale copies', 'Scale drawings', 'Volume and surface area word problems'],
                'Statistics and Probability' : ['Basic probability', 'Probability models', 'Compound events and sample spaces', 'Comparing and sampling populations']}

const grade8 = {'Numbers and Operations' : ['Repeating decimals', 'Square roots and cube roots', 'Irrational numbers', 'Approximating irrational numbers', 'Exponents with negative bases', 'Exponent properties intro', 'Negative exponents', 'Exponent properties (integer exponents)', 'Working with powers of 10', 'Scientific notation intro', 'Arithmetic with numbers in scientific notation', 'Scientific notation word problems'],
                'Solving Equations with one Unknown' : ['Equations with variables on both sides', 'Equations with parentheses', 'Number of solutions to equations', 'Equations word problems'],
                'Linear Equations and Functions' : ['Graphing proportional relationships', 'Solutions to linear equations', 'Intercepts', 'Slope', 'Intro to slope-intercept form', 'Graphing slope-intercept form', 'Writing slope-intercept equations', 'Functions', 'Linear models', 'Comparing linear functions', 'Constructing linear models for real-world relationships', 'Recognizing functions', 'Linear and nonlinear functions'],
                'Systems of Equations' : ['Intro to systems of equations', 'Systems of equations with graphing', 'solving systems with substitution', 'Number of solutions to systems of equations', 'Systems of equations word problems'],
                'Geometry' : ['Angles between intersecting lines', 'Triangle angles', 'Pythagorean theorem', 'Pythagorean theorem application', 'Pythagorean theorem and distance between points', 'Pythagorean theorem proofs', 'Volume'],
                'Geometric Transformations' : ['Transformations intro', 'Translations', 'Rotations', 'Reflections', 'Properties and definitions of transformations', 'Dilations', 'Congruence and similarity'],
                'Data and Modeling' : ['Introduction to scatter plots', 'Interpreting scatter plots', 'Estimating lines of best fit', 'Two-way tables']}

const grade9 = {'Solving Equations and Inequalities' : ['Linear equations with variables on both sides', 'Linear equations with parentheses', 'Analyzing the number of solutions to linear equations', 'Linear equations with unknown coefficients', 'Multi-step inequalities', 'Compound inequalities'],
                'Working with Units' : ['Rate conversion', 'Appropriate units', 'Word problems with multiple units'],
                'Linear Equation and Graphs' : ['Two-variable linear equations intro', 'x-intercepts and y-intercepts', 'Slope', 'Horizontal and verticle lines', 'Intro to slope-intercept form', 'graphing slope-intercept equations', 'Writing slope-intercept equations', 'Point-slope form', 'Standard form', 'Summary: Forms of two-variable linear equations'],
                'Functions' : ['Evaluating functions', 'Inputs and outputs of a function', 'Functions and equations', 'Interpreting function notation', 'Introduction to the domain and range of a function', 'Determining the domain of a runction', 'Recognizing functions', 'Maximum and minimum points', 'Intervals where a function is positive, negative, increasing, or decreasing', 'Interpreting features of graphs', 'Average rate of change', 'Average rate of change word problems'],
                'Linear Word Problems' : ['Interpreting linear functions and equations', 'Comparing linear functions', 'Constructing linear models for real-world relationships', 'Linear models word problems'],
                'Systems of Equations' : ['Systems of equations overview', 'Introduction to systems of equations', 'Equivalent systems of equations and the elimination method', 'Solving systems of equations with substitution', 'Manipulating expressions with unknown variables', 'Number of solutions to systems of equations', 'Solving any system of linear equations', 'Systems of equations word problems'],
                'Inequalities (Systems and Graphs)' : ['Checking solutions of two-variable inequalities', 'Graphing two-variable inequalities', 'Modeling with linear inequalities'],
                'Scatterplots' : ['Creating and interpreting scatterplots', 'Estimating with trend lines'],
                'Data Distributions' : ['Displays of distributions', 'Summarizing enter of distributions (central tendency)', 'Box and whisker plots', 'Comparing distributions'],
                'Two-Way Tables' : ['Two-way frequency tables', 'Two-way relative frequency tables'],
                'Sequences' : ['Introduction to arithmetic sequences', 'Constructing arithmetic sequences', 'Introduction to geometric sequences', 'Constructing geometric sequences', 'Modeling with sequences', 'General sequences'],
                'Rational Exponents and Radicals' : ['Exponent properties review', 'Radicals', 'Rational exponents intro', 'Properties of exponents (rational exponents)', 'Advanced exponent and radical evaluation', 'Simplifying square roots', 'Simplifying radicals (higher-index roots)'],
                'Exponential Growth and Decay' : ['Exponential vs. linear growth', 'Exponential expressions', 'Graphs of exponential growth', 'Exponential vs. linear growth over time', 'Exponential decay', 'Exponential functions from tables and graphs'],
                'Geometric Transformations' : ['Introduction to rigid transformations', 'Translations', 'Rotations', 'Reflections', 'Rigid transformations overview', 'Dilations', 'Properties and definitions of transformations', 'Symmetry'],
                'Congruence' : ['Transformations and congruence', 'Triangle congruence', 'Theorems concerning triangel properties', 'Working with triangles', 'Theorems concerning quadrilateral properties', 'Proofs of general theorems that use triangle congruence', 'Constructing bisectors of lines and angles'],
                'Analytic Geometry' : ['Distance and midpoints', 'Dividing line segments', 'Problem solving with distance on the coordinate plane', 'Parallel and perpendicular lines on the coordinate plane', 'Equations of parallel and perpendicular lines', 'Coordinate plane proofs']}

const grade10 = {'Absolute Value and Piecewise Functions' : ['Graphs of absolute value functions', 'Piecewise Functions'],
                 'Polynomials' : ['Intro to polynomials', 'Adding and subtracting polynomials', 'Adding and subtracting polynomials: two variables', 'Multiplying monomials', 'Multiplying monomials by polynomials', 'Multiplying binomials', 'Multiplying binomials by polynomials', 'Special products of binomials', 'Polynomials word problems', 'Long division of polynomials', 'Synthetic division of polynomials', 'Practive dividing polynomials with remainders'],
                 'Factorization' : ['Introduction to factorization', 'Factoring monomials', 'Factoring polynomials by takin gcommon factors', 'Evauluating expressions with unknown variables', 'Factoring quadratics intro', 'Factoring quadratics by grouping', 'Factoring polynomials with quadratic forms', 'Factoring quadratics: Difference of squares', 'Factoring quadratics: Perfect squares', 'Strategy in factoring quadratics', 'Factoring polynomials with special product forms', 'Polynomial remainder theorem'],
                 'Quadratics' : ['Parabolas intro', 'Quadratic factored form', 'Solving quadratics by taking square roots', 'Quadratic vertex form', 'Solving quadratics by factoring', 'Completing the square', 'The quadratic formula', 'Quadratic standard form', 'Features and forms of quadratic functions', 'Transforming parabolas'],
                 'Irrational Nubmers' : ['Irrational numbers', 'Sums and products of rational/irrational numbers', 'Proofs concerning irrational numbers'],
                 'Complex Numbers' : ['What are the imaginary numbers', 'What are the complex numbers', 'The complex plane', 'Adding and subtracting complex numbers', 'Multiplying complex numbers'],
                 'Exponential Growth and Decay' : ['Equivalent forms of exponential expressions', 'Exponential equations: properties of exponents', 'Interpreting the rate of change of exponential models', 'Constructing exponential models according to rate of change', 'Advanced interpretation of exponential models', 'Distinguishing between linear and exponential growth'],
                 'Modeling with Algebra' : ['Modeling with one-variable equations & inequalities', 'Manipulating formulas'],
                 'Similarity' : ['Definitions of similarity', 'Introduction to triangle similarity', 'Solving similar triangles', 'Angle bisector theorem', 'Solving problems with similar & congruent triangles', 'Solving modeling problems with similar and congruent triangles'],
                 'Right Triangles and Trigonomotry' : ['Pythagorean theorem', 'Pythagorean theorem proofs', 'Special right triangles', 'Introduction to the trigonometric ratios', 'Solving for a side in a right triange using the trig ratios', 'Solving for an angle in a right triangle using the trig ratios', 'Modeling with right triangles', 'Trigonometric ratios and similarity', 'Sine and cosine of complementary angles'],
                 'Solid Geometry' : ['Solid geometry intro', 'Density', '2D vs. 3D objects'],
                 'Circles' : ['Circle basics', 'Arc measure', 'Arc length (from degrees)', 'Introduction to radians', 'Arc length (from radians)', 'Sectors', 'Inscribed angles', 'Inscribed shapes problem solving', 'Properties of tangents', 'Area of incribed triangle', 'Constructing regular polygons incribed in circles', 'Constructing circumcircles and incircles', 'Constructing a line tangent to a circle'],
                 'Conic Sections' : ['Introduction to conic sections', 'Features of a circle', 'Standard equation of a circle', 'Expanded equation of a circle', 'Focus & directrix of a parabola'],
                 'Probability' : ['Probability basics', 'Counting with combinations', 'Probability with counting, permutations, and combinations', 'Multiplication rule for independent events', 'Multiplication rule for dependent events', 'Addition rule for probability', 'Conditional probability', 'Simulation and randomness', 'Expected value']}

const grade11 = {'Functions' : ['Combining functions', 'Composing function', 'Modeling situations by combining and composing functions', 'Shifting functions', 'stretching functions', 'Introduction to inverses of functions', 'Finding inverse functions', 'Verifying that functions are inverses', 'Determining whether a function is invertible'],
                 'Polynomials' : ['Binomial theorem', 'Understanding the binomial theorem', 'Advanced polynomial factorization methods', 'Proving polynomial identities', 'Polynomial identities with complex numbers', 'Quadratic equations with complex numbers', 'Fundamental theorem of Algebra', 'Finding zeroes of polynomials', 'Zeroes of polynomials and their graphs', 'End behavior of polynomial functions', 'Graphs of polynomials', 'Introduction to symmetry of functions', 'Symmetry of polynomial functions'],
                 'Radical Relationships' : ['Square-root equations', 'Extraneous solutions of radical equations', 'Cube-root equations', 'Domain of radical functions', 'Graphs of radical functions'],
                 'Rational Relationships' : ['Simplifying rational expressions', 'Multiplying and dividing rational expressions', 'Adding and subtracting rational expressions', 'Nested fractions', 'Rational equations', 'Direct and inverse variation', 'End behavior of rational functions', 'Discontinuities of rational functions', 'Graphs of rational functions', 'Modeling with rational functions'],
                 'Exponentials and Logarithms' : ['Introduction to logarithmss', 'The constant e and the natural logarithm', 'Properties of logarithms', 'Change of base formula for logarithms', 'Exponential equations: logarithms', 'Solving exponential models', 'Graphs of exponential functions', 'Graphs of logarithmic functions', 'Logarithmic scale'],
                 'Trigonometry' : ['Law of sines', 'Law of cosines', 'Solving general triangles', 'Introduction to radians', 'Unit circle definition of sine, cosine, and tangent', 'Graphs of sine, cosine, and tangent', 'Basic trigonometric identities', 'Trigonometric values of special angles', 'Pythagorean identity', 'Introduction to amplitude, midline, and extrema of sinusoidal functions', 'Finding amplitude and midline from formula', 'Period of sinusoidal functions', 'Graphing sinusoidal functions', 'Constructing sinusoidal functions'],
                 'Series' : ['Basic sigma notation', 'Finite arithmetic series', 'Finite geometric series', 'Finite geometric series applications'],
                 'Study Design' : ['Samples and surveys', 'Observational studies and expreiments'],
                 'Binomial Probability' : ['Binomial Probability'],
                 'Normal Distributions' : ['Normal Distributions']}

const lessonInfo = [grade1, grade2, grade3, grade4, grade5, grade6, grade7, grade8, grade9, grade10, grade11]
let lessonList = document.getElementById('lessonList');
initializeEmptyLessonsMap();
populateLessons();
document.getElementById('programLink').setAttribute('href', links[studentGrade - 1])

lessonList.addEventListener('click', (e) => {
  if (e.target.className.includes('button2')) {
    let section = e.target.getAttribute('data-section');
    let lesson = e.target.getAttribute('data-lesson');
    if (currentLessonData[section][lesson]['status'] == 'not assigned') {
      setObjectValue([section, lesson, 'date'], date.getTime(), currentLessonData);
      setObjectValue([section, lesson, 'status'], 'needs help', currentLessonData);
      populateLessons()
    }
    else if (currentLessonData[section][lesson]['status'] == 'needs help') {
      setObjectValue([section, lesson, 'date'], date.getTime(), currentLessonData);
      setObjectValue([section, lesson, 'status'], 'assigned', currentLessonData);
      populateLessons()
    }
    else if (currentLessonData[section][lesson]['status'] == 'assigned') {
      setObjectValue([section, lesson, 'date'], date.getTime(), currentLessonData);
      setObjectValue([section, lesson, 'status'], 'mastered', currentLessonData);
      populateLessons()
    }
    else if (currentLessonData[section][lesson]['status'] == 'mastered') {
      setObjectValue([section, lesson, 'date'], undefined, currentLessonData);
      setObjectValue([section, lesson, 'status'], 'not assigned', currentLessonData);
      populateLessons()
    }
  }
})

function retrieveInitialData() {
  let student = queryStrings()['student'];

  let profileProm = getStudentProfile(student);
  let notesProm = getStudentNotes(student);
  let stProfileProm = getStudentSTProfile(student); 

  let promises = [profileProm, notesProm, stProfileProm];
  return Promise.all(promises);
}

function getStudentProfile(studentUID) {
  const studentProfileRef = firebase.firestore().collection('Students').doc(studentUID);
  return studentProfileRef.get()
  .then((doc) => {
    if (doc.exists) {
      studentProfileData = doc.data();
    }
  })
}

function getStudentNotes(studentUID) {
  const studentNotesRef = firebase.firestore().collection('Students').doc(studentUID).collection('Subject-Tutoring').doc('notes');
  return studentNotesRef.get()
  .then((doc) => {
    if (doc.exists) {
      studentNotesData = doc.data();
    }
  })
}

function getStudentSTProfile(studentUID) {
  const studentSTProfileRef = firebase.firestore().collection('Students').doc(studentUID).collection('Subject-Tutoring').doc('profile');
  return studentSTProfileRef.get()
  .then((doc) => {
    if (doc.exists) {
      studentSTProfileData = doc.data();
    }
  })
}

function queryStrings() {
  var GET = {};
  var queryString = window.location.search.replace(/^\?/, '');
  queryString.split(/\&/).forEach(function(keyValuePair) {
      var paramName = keyValuePair.replace(/=.*$/, ""); // some decoding is probably necessary
      var paramValue = keyValuePair.replace(/^[^=]*\=/, ""); // some decoding is probably necessary
      GET[paramName] = paramValue;
  });

  return GET;
}

function setStudentProfile() {
  document.getElementById('student-name').innerHTML = studentProfileData['studentFirstName'] + " " + studentProfileData['studentLastName'];
}

function setStudentSTProfile() {
  document.getElementById('student-expectation').innerHTML = studentSTProfileData['expectation'] || "No expectation set."
}

function updateStudentExpectation() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      user.getIdTokenResult()
      .then((idTokenResult) => {
        let role = idTokenResult.claims.role;
        if (role == 'admin' || role == 'dev' || role == 'secretary') {
          const studentUID = queryStrings()['student'];
          let studentExpectationElem = document.getElementById('student-expectation');
          let parent = studentExpectationElem.parentNode;
          let expectationTag = studentExpectationElem.tagName;
          if (expectationTag == "INPUT") {
            //update the goal and send it back to an H2 tag
            let expectationStr = studentExpectationElem.value;
            const studentSTProfileRef = firebase.firestore().collection('Students').doc(studentUID).collection('Subject-Tutoring').doc('profile');
            studentSTProfileRef.get()
            .then((doc) => {
              if(doc.exists) {
                studentSTProfileRef.update({
                  expectation : expectationStr
                })
                .then(() => {
                  //remove the input and replace it with the text
                  studentExpectationElem.remove();
                  let newElem = document.createElement('h2');
                  newElem.id = 'student-expectation';
                  newElem.innerHTML = expectationStr;
                  parent.appendChild(newElem);
                })
                .catch((error) => handleFirebaseErrors(error, document.currentScript.src));
              }
              else {
                studentSTProfileRef.set({
                  expectation : expectationStr
                })
                .then(() => {
                  //remove the input and replace it with the text
                  studentExpectationElem.remove();
                  let newElem = document.createElement('h2');
                  newElem.id = 'student-expectation';
                  newElem.innerHTML = expectationStr;
                  parent.appendChild(newElem);
                })
                .catch((error) => handleFirebaseErrors(error, document.currentScript.src));
              }
            })
          }
          else {
            //turn the element into an input to allow for changes
            let expectationStr = studentExpectationElem.innerHTML;
            studentExpectationElem.remove();
            let newElem = document.createElement('input');
            newElem.id = 'student-expectation';
            newElem.value = expectationStr;
            newElem.classList.add("expectation-input");
            parent.appendChild(newElem);
          }
        }
      })
      .catch((error) => handleFirebaseErrors(error, document.currentScript.src));
    }
  });
}

//all of the notes stuff
function getNotes(type) {
  const notes = studentNotesData[type];
  let noteTimes = [];
  for (const time in notes) {
    noteTimes.push(parseInt(time));
  }

  noteTimes.sort((a,b) => {return a-b});
  for (let i = 0; i < noteTimes.length; i++) {
    setNotes(type, notes[noteTimes[i]]["note"], noteTimes[i], notes[noteTimes[i]]["user"], notes[noteTimes[i]]["isSessionNote"]);
  }
}

function setNotes(type, note, time, author, isSessionNote) {
  firebase.auth().onAuthStateChanged((user) => {
    const currentUser = user?.uid ?? null;
    if (user) {
      user.getIdTokenResult()
      .then((idTokenResult) => {
        let role = idTokenResult.claims.role;
        if (note) {
          //all the messages
          let messageBlock = document.getElementById('student-' + type + '-notes');
          //the div that contains the time and message
          let messageDiv = document.createElement('div');
          //the message itself
          let message = document.createElement('div');
          //time for the message
          let timeElem = document.createElement('p');

          //display the time above the mesasge
          timeElem.innerHTML = convertFromDateInt(time)['shortDate'];
          timeElem.classList.add('time');
          messageDiv.appendChild(timeElem);

          //set up the message
          message.innerHTML = note;
          //author's name element
          let authorElem = document.createElement('p');
          authorElem.classList.add("author");
          message.appendChild(authorElem);

          const getUserDisplayName = firebase.functions().httpsCallable('getUserDisplayName');
          getUserDisplayName({
            uid : author
          })
          .then((result) => {
            const authorName = result.data ?? "anonymous";
            authorElem.innerHTML = authorName;
            scrollBottomNotes(type);
          })
          .catch((error) => handleFirebaseErrors(error, document.currentScript.src));

          messageDiv.setAttribute('data-time', time);
          message.classList.add("student-note");
          if (currentUser == author) {
            messageDiv.classList.add("right");
          }
          else {
            messageDiv.classList.add("left");
          }

          const getUserRole = firebase.functions().httpsCallable('getUserRole');
          getUserRole({
            uid : author
          })
          .then((result) => {
            const authorRole = result.data ?? null;
            if (authorRole == "admin") {
              message.classList.add("important");
            }
            scrollBottomNotes(type);
          })
          .catch((error) => handleFirebaseErrors(error, document.currentScript.src));

          if (isSessionNote) {
            message.classList.add('session');
          }
          

          //only give the option to delete if the currentUser is the author, admin, or dev. Don't allow to delete if session notes
          if ((author == currentUser || role == "admin" || role == "dev") && !isSessionNote) {
            let deleteMessage = document.createElement('div');
            deleteMessage.classList.add("delete");
            let theX = document.createElement('p');
            theX.innerHTML = "X";
            theX.classList.add('no-margins');
            deleteMessage.appendChild(theX);
            deleteMessage.addEventListener('click', (event) => deleteNote(type, event));
            message.appendChild(deleteMessage);
          }
          
          messageDiv.appendChild(message);
          messageBlock.appendChild(messageDiv);
          document.getElementById('student-' + type + '-notes-input').value = null;
          scrollBottomNotes(type);
        }
      })
      .catch((error) =>  {
        handleFirebaseErrors(error, document.currentScript.src);
        console.log(error);
      });
    }
  });
}

function deleteNote(type, event) {
  let message = event.target.closest(".student-note").parentNode;
  let confirmation = confirm("Are you sure you want to delete this message?");
  if (confirmation) {
    const currentStudent = queryStrings()['student'];
    const time = message.dataset.time;
    const studentNotesDocRef = firebase.firestore().collection("Students").doc(currentStudent).collection("Subject-Tutoring").doc("notes");
    studentNotesDocRef.update({
      [`${type}.${time}`] : firebase.firestore.FieldValue.delete()
    })
    .then(() => {
      message.remove();
    })
    .catch((error) => {
      handleFirebaseErrors(error, document.currentScript.src);
    })
  }
}

function scrollBottomNotes(type) {
  let notes = document.getElementById("student-" + type + "-notes");
  notes.scrollTop = notes.scrollHeight;
}

function sendNotes(type, note, time, author, isSessionNote = false) {
  const data = {
    user : author,
    note : note,
    isSessionNote : isSessionNote
  } 

  const currentStudent = queryStrings()['student'];

  if (note) {
    //upload the note to firebase
    const studentNotesDocRef = firebase.firestore().collection("Students").doc(currentStudent).collection("Subject-Tutoring").doc("notes");
    studentNotesDocRef.get()
    .then((doc) => {
      if (doc.exists) {
        return studentNotesDocRef.update({
          [`${type}.${time}`] : data
        })
        .then(() => {
          //send the note into the message div
          setNotes(type, note, time, author, isSessionNote);
        })
        .catch((error) => {
          handleFirebaseErrors(error, document.currentScript.src);
        });
      }
      else {
        return studentNotesDocRef.set({
          [`${type}`] : {
            [`${time}`] : data
          }
        })
        .then(() => {
          //send the note into the message div
          setNotes(type, note, time, author, isSessionNote);
        })
        .catch((error) => {
          handleFirebaseErrors(error, document.currentScript.src);
        });
      }
    })
    .catch((error) => {
      handleFirebaseErrors(error, document.currentScript.src);
      console.log(error);
    });
  }
  else {
    return Promise.resolve("No note.")
  }
}

document.getElementById("student-log-notes-input").addEventListener('keydown', (event) =>  {
  if (!event.ctrlKey && event.key == "Enter") {
    event.preventDefault();
    const currentUser = firebase.auth().currentUser.uid;
    const note = document.getElementById('student-log-notes-input').value;
    const time = new Date().getTime();
    sendNotes('log', note, time, currentUser);
  }
});

function removeLessons() {
  let children = lessonList.querySelectorAll('div');
  const numChildren = children.length;
  for (let child = 0; child < numChildren; child++) {
    children[child].remove()
  }
}

function populateLessons() {
  removeLessons();
  let gradeLessons = lessonInfo[studentGrade - 1]

  // Add the lessons
  let sections = Object.keys(gradeLessons)
  for (let i = 0; i < sections.length; i++) {
    // Add the section
    const element1 = createElement('div', ['sectionGridBox'], [], [], sections[i])
    const element2 = createElement('div', ['sectionGridBox'], [], [], "")
    element1.style.fontWeight = 'bold'
    lessonList.append(element1);
    lessonList.append(element2);
    
    // Add the lessons
    for (let j = 0; j < Object.values(gradeLessons[sections[i]]).length; j++) {
      const lesson = gradeLessons[sections[i]][j]
      const element1 = createElement('div', ['gridBox'], [], [] , lesson);
      const element2 = createElement('div', ['gridBox', 'button2'], ['data-section', 'data-lesson'], [sections[i], lesson], "")
      element2.classList.add(colors[currentLessonData[sections[i]][lesson]['status']])
      const dateInfo = convertFromDateInt(currentLessonData[sections[i]][lesson]['date']);
      if (dateInfo != undefined) {
        element2.innerHTML = dateInfo['shortDate']
      }
      lessonList.append(element1);
      lessonList.append(element2);
    }
  }
}

function initializeEmptyLessonsMap() {
  const gradeLessons = lessonInfo[studentGrade - 1]
  const sections = Object.keys(gradeLessons);
  let lessons = undefined;
  for (let i = 0; i < sections.length; i++) {
    lessons = Object.values(gradeLessons[sections[i]]);
    for (let j = 0; j < lessons.length; j++) {
      setObjectValue([sections[i], lessons[j], 'date'], undefined, currentLessonData);
      setObjectValue([sections[i], lessons[j], 'status'], 'not assigned', currentLessonData);
    }
  }
}

/**
 * create html element
 * @param {String} elementType tag name for the element that will be created
 * @param {[String]} classes classes for the element
 * @param {[String]} attributes attributes for the element
 * @param {[String]} values values for each attribute for the element
 * @param {String} text innerhtml for the element
 * @returns {HTMLElement} html element of the given tag
 */
function createElement(elementType, classes = [], attributes = [], values = [], text = "") {
  // Initialize the element
  let element = document.createElement(elementType);

  // Set each of the specified attributes for the element
  if (attributes.length == values.length && attributes.length > 0) {
    for (let i = 0; i < attributes.length; i++) {
      element.setAttribute(attributes[i], values[i]);
    }
  }

  // Add the classes to the element
  for (let i = 0; i < classes.length; i++) {
    element.classList.add(classes[i]);
  }

  // Set the inner html text
  if (text != "") {
    element.innerHTML = text;
  }

  // Return the element
  return element;
}
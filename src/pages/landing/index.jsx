import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ArrowLeft, Star, ChevronDown as FaqToggle } from "lucide-react";
import classes from "./landing.module.css";
import { heroTexts, features, services, stats, testimonials, faqs } from "./HomeAnimations";
import HomeBGEffects from "./HomeBGEffects";

function Landing() {
    const navigate = useNavigate();

    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);
    const [statsVisible, setStatsVisible] = useState(false);
    const [pageLoaded, setPageLoaded] = useState(false);

    // useEffect לאנימציית הטקסט
    useEffect(() => {
        const currentText = heroTexts[currentTextIndex];
        let timeoutId;

        if (isTyping) {
            // הוספת אותיות
            if (displayedText.length < currentText.length) {
                timeoutId = setTimeout(() => {
                    setDisplayedText(currentText.slice(0, displayedText.length + 1));
                }, 100);
            } else {
                // המתנה לפני מחיקה
                timeoutId = setTimeout(() => {
                    setIsTyping(false);
                }, 2000);
            }
        } else {
            // מחיקת אותיות
            if (displayedText.length > 0) {
                timeoutId = setTimeout(() => {
                    setDisplayedText(displayedText.slice(0, -1));
                }, 5);
            } else {
                // מעבר לטקסט הבא
                setTimeout(() => {
                    setCurrentTextIndex(
                        (prevIndex) => (prevIndex + 1) % heroTexts.length
                    );
                    setIsTyping(true);
                }, 1200);
            }
        }

        return () => clearTimeout(timeoutId);
    }, [displayedText, isTyping, currentTextIndex]);

    // useEffect לעדכון כותרת הדף
    useEffect(() => {
        document.title = "טסים - דף הבית";
        // סימולציה של loading
        const timer = setTimeout(() => setPageLoaded(true), 800);
        return () => clearTimeout(timer);
    }, []);

    // useEffect לאנימציית הסטטיסטיקות
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !statsVisible) {
                        setStatsVisible(true);
                    }
                });
            },
            { threshold: 0.3 }
        );

        const statsSection = document.getElementById("stats-section");
        if (statsSection) {
            observer.observe(statsSection);
        }

        return () => observer.disconnect();
    }, [statsVisible]);

    //  פונקציה לגלילה לחלק השירותים
    const scrollToServices = () => {
        const section = document.getElementById("services");
        if (section) {
            // במקום scrollIntoView, השתמש ב-scrollTo עם offset
            const offsetTop = section.offsetTop - 100; // 100px מרווח מעל
            window.scrollTo({
                top: offsetTop,
                behavior: "smooth",
            });
        }
    };

    //  פונקציה לגלילה לחלק הבא של התכונות
    const scrollToNextSection = () => {
        const featuresSection = document.getElementById("features");
        if (featuresSection) {
            const offsetTop = featuresSection.offsetTop - 50;
            window.scrollTo({
                top: offsetTop,
                behavior: "smooth",
            });
        }
    };

    // פונקציה לטיפול ב-FAQ
    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    // פונקציה לרינדור כוכבי דירוג
    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                className={`${classes.star} ${i < rating ? 'fill-current' : ''}`}
                fill={i < rating ? '#fbbf24' : 'none'}
            />
        ));
    };

    // Loading Component
    if (!pageLoaded) {
        return (
            <div className={classes.loadingContainer}>
                <div className={classes.loadingSpinner}>
                    <div className={classes.spinnerRing}></div>
                    <p className={classes.loadingText}>טוען את החוויה המושלמת...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={classes.container}>
            {/* Background Effects */}
            <HomeBGEffects setIsVisible={setIsVisible} />

            {/* Main Content */}
            <div className={classes.mainContent}>
                {/* Hero Section */}
                <section className={classes.heroSection}>
                    <div className={classes.logo}>
                        <img src="/images/logo.png" alt="logo-tasim" />
                    </div>
                    <div
                        className={`${classes.heroContent} ${isVisible ? classes.visible : ""
                            }`}
                    >
                        <h1 className={classes.heroTitle}>
                            {displayedText}
                            <span className={classes.cursor}>|</span>
                        </h1>
                        <p className={classes.heroSubtitle}>
                            השכרת טלפונים וסימים לחו"ל בטכנולוגיה המתקדמת ביותר <br />
                            🌍 כיסוי ב-190+ מדינות | 📞 מספר ישראלי בכל השכרה | 🛡️ תמיכה 24/6 <br />
                            טסים - השותפים המהימנים שלכם למסע מושלם
                        </p>

                        <div className={classes.heroButtons}>
                            <button
                                onClick={() => navigate("/order-form")}
                                className={classes.primaryButton}
                            >
                                <span className={classes.buttonContent}>
                                    הזמינו עכשיו
                                    <ArrowLeft className={classes.arrowLeft} />
                                </span>
                                <div className={classes.buttonOverlay} />
                            </button>

                            <button
                                onClick={scrollToServices}
                                className={classes.secondaryButton}
                            >
                                גלו את השירותים
                            </button>

                            <button
                                onClick={() => navigate("/about")}
                                className={classes.secondaryButton}
                            >
                                קיראו עלינו
                            </button>
                        </div>
                    </div>

                    {/* Scroll indicator */}
                    <div
                        className={classes.scrollIndicator}
                        onClick={scrollToNextSection}
                    >
                        <ChevronDown className="w-8 h-8" />
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className={classes.featuresSection}>
                    <div className={classes.featuresContainer}>
                        <h2 className={classes.featuresTitle}>למה לבחור טסים?</h2>

                        <div className={classes.featuresGrid}>
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className={classes.featureCard}
                                    style={{
                                        animationDelay: `${index * 200}ms`,
                                    }}
                                >
                                    <div className={classes.featureContent}>
                                        <div className={classes.featureIcon}>{feature.icon}</div>
                                        <h3 className={classes.featureTitle}>{feature.title}</h3>
                                        <p className={classes.featureDesc}>{feature.desc}</p>
                                    </div>

                                    {/* Glow effect */}
                                    <div className={classes.featureGlow} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                <section className={classes.servicesSection}>
                    <div className={classes.servicesContainer}>
                        <h2 id="services" className={classes.servicesTitle}>
                            השירותים שלנו
                        </h2>
                        <p className={classes.servicesSubtitle}>
                            פתרונות תקשורת מתקדמים לכל סוג של נסיעה
                        </p>

                        <div className={classes.servicesGrid}>
                            {services.map((service, index) => (
                                <div
                                    key={index}
                                    className={classes.serviceCard}
                                    style={{
                                        animationDelay: `${index * 150}ms`,
                                    }}
                                >
                                    <div className={classes.serviceHeader}>
                                        <div className={classes.serviceIcon}>{service.icon}</div>
                                        <h3 className={classes.serviceTitle}>{service.title}</h3>
                                        <p className={classes.serviceDesc}>{service.desc}</p>
                                    </div>

                                    <div className={classes.serviceFeatures}>
                                        {service.features.map((feature, i) => (
                                            <div key={i} className={classes.serviceFeature}>
                                                <div className={classes.featureBullet} />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => navigate(service.linkTo)}
                                        className={classes.serviceButton}
                                    >
                                        <span>לפרטים נוספים</span>
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>

                                    {/* Service glow effect */}
                                    <div className={classes.serviceGlow} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section id="stats-section" className={classes.statsSection}>
                    <div className={classes.statsContainer}>
                        <div className={classes.statsGrid}>
                            {stats.map((stat, index) => (
                                <div
                                    key={index}
                                    className={classes.statCard}
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                        transform: statsVisible ? 'translateY(0)' : 'translateY(30px)',
                                        opacity: statsVisible ? 1 : 0,
                                        transition: `all 0.6s ease ${index * 100}ms`
                                    }}
                                >
                                    <div className={classes.statIcon}>{stat.icon}</div>
                                    <div className={classes.statNumber}>{stat.number}</div>
                                    <div className={classes.statLabel}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className={classes.testimonialsSection}>
                    <div className={classes.testimonialsContainer}>
                        <h2 className={classes.testimonialsTitle}>מה הלקוחות אומרים</h2>
                        <p className={classes.testimonialsSubtitle}>
                            אלפי לקוחות מרוצים בוחרים בטסים שוב ושוב
                        </p>

                        <div className={classes.testimonialsGrid}>
                            {testimonials.map((testimonial, index) => (
                                <div
                                    key={index}
                                    className={classes.testimonialCard}
                                    style={{
                                        animationDelay: `${index * 200}ms`,
                                    }}
                                >
                                    <p className={classes.testimonialText}>"{testimonial.text}"</p>

                                    <div className={classes.testimonialAuthor}>
                                        <div className={classes.authorInfo}>
                                            <div className={classes.authorName}>{testimonial.name}</div>
                                            <div className={classes.authorLocation}>{testimonial.location}</div>
                                        </div>

                                        <div className={classes.testimonialRating}>
                                            {renderStars(testimonial.rating)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className={classes.faqSection}>
                    <div className={classes.faqContainer}>
                        <h2 className={classes.faqTitle}>שאלות נפוצות</h2>
                        <p className={classes.faqSubtitle}>
                            הכל שרציתם לדעת על השירותים שלנו
                        </p>

                        <div className={classes.faqList}>
                            {faqs.map((faq, index) => (
                                <div key={index} className={classes.faqItem}>
                                    <div
                                        className={classes.faqQuestion}
                                        onClick={() => toggleFaq(index)}
                                    >
                                        <span>{faq.question}</span>
                                        <FaqToggle
                                            className={`${classes.faqToggle} ${openFaq === index ? classes.open : ''}`}
                                        />
                                    </div>

                                    <div className={`${classes.faqAnswer} ${openFaq !== index ? classes.hidden : ''}`}>
                                        {faq.answer}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Enhanced CTA Section */}
                <section className={classes.enhancedCtaSection}>
                    <div className={classes.enhancedCtaContainer}>
                        <div className={classes.enhancedCtaCard}>
                            <h2 className={classes.enhancedCtaTitle}>מוכנים לטוס? בואו נתחיל!</h2>
                            <p className={classes.enhancedCtaSubtitle}>
                                הזמינו עכשיו וקבלו את הטלפון עד הבית שלכם. <br />
                                חוויית השירות הטובה ביותר מחכה לכם - טסים איתכם בכל צעד!
                            </p>

                            <div className={classes.enhancedCtaButtons}>
                                <button
                                    onClick={() => navigate("/order-form")}
                                    className={classes.enhancedCtaButton}
                                >
                                    הזמינו עכשיו
                                    <ArrowLeft className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => navigate("/contact")}
                                    className={`${classes.enhancedCtaButton} ${classes.enhancedCtaSecondary}`}
                                >
                                    צרו קשר לייעוץ
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Landing;
